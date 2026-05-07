const crypto = require("crypto");

const SESSION_DAYS = 7;
const RESET_CODE_MINUTES = 10;
const SESSION_COOKIE = "__Host-eduboard_session";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "";

function response(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

function makeSessionCookie(token) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readCookie(event, name) {
  const cookieHeader = event.headers.cookie || event.headers.Cookie || "";
  const prefix = `${name}=`;
  const match = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}

function getRequestSessionToken(event, body) {
  return String(body.sessionToken || readCookie(event, SESSION_COOKIE) || "");
}

function getClientIp(event) {
  return (
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["client-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function randomToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString("base64url");
}

function randomDigits(length = 6) {
  let out = "";
  while (out.length < length) out += String(crypto.randomInt(0, 10));
  return out;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(String(password), Buffer.from(salt, "hex"), iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return { ok: false, normalized: null };
  if (!String(stored).startsWith("pbkdf2$")) {
    return {
      ok: stored === password,
      normalized: stored === password ? hashPassword(password) : null
    };
  }

  const parts = String(stored).split("$");
  if (parts.length !== 4) return { ok: false, normalized: null };
  const iterations = Number.parseInt(parts[1], 10);
  const actual = crypto.pbkdf2Sync(String(password), Buffer.from(parts[2], "hex"), iterations, 32, "sha256");
  const expected = Buffer.from(parts[3], "hex");
  return {
    ok: actual.length === expected.length && crypto.timingSafeEqual(actual, expected),
    normalized: stored
  };
}

function cleanNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanUsernames(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
}

function cleanRole(value) {
  const role = String(value || "").trim();
  const allowed = new Set(["admin", "teacher", "class_admin", "student", "user"]);
  if (!allowed.has(role)) throw new Error("허용되지 않는 권한입니다.");
  return role;
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function qs(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

function inFilter(values) {
  const escaped = values.map((value) => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `in.(${escaped.join(",")})`;
}

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Netlify 환경변수 SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = text;
    }
  }
  if (!res.ok) {
    const message = data?.message || data?.hint || text || "Supabase 요청이 실패했습니다.";
    throw new Error(message);
  }
  return data;
}

async function selectRows(table, params) {
  return supabaseRequest(`${table}${qs(params)}`, { method: "GET" });
}

async function maybeSingle(table, params) {
  const rows = await selectRows(table, { ...params, limit: 1 });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function insertRows(table, rows) {
  return supabaseRequest(table, {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify(rows)
  });
}

async function upsertRows(table, rows, onConflict) {
  return supabaseRequest(`${table}${qs({ on_conflict: onConflict })}`, {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  });
}

async function updateRows(table, params, payload) {
  return supabaseRequest(`${table}${qs(params)}`, {
    method: "PATCH",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
}

async function deleteRows(table, params) {
  return supabaseRequest(`${table}${qs(params)}`, {
    method: "DELETE",
    headers: { prefer: "return=minimal" }
  });
}

async function loadUserByLogin(login) {
  for (const column of ["username", "email"]) {
    const user = await maybeSingle("users", { select: "*", [column]: `eq.${login}` });
    if (user) return user;
  }
  return null;
}

async function createSession(username) {
  const sessionToken = randomToken();
  const tokenHash = sha256(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await insertRows("app_sessions", [{ token_hash: tokenHash, username, expires_at: expiresAt }]);
  return { sessionToken, tokenHash, expiresAt };
}

async function loadSession(sessionToken) {
  if (!sessionToken) return null;
  const tokenHash = sha256(sessionToken);
  const session = await maybeSingle("app_sessions", {
    select: "token_hash,username,expires_at",
    token_hash: `eq.${tokenHash}`,
    expires_at: `gt.${new Date().toISOString()}`
  });
  if (!session) return null;

  const user = await maybeSingle("users", { select: "*", username: `eq.${session.username}` });
  if (!user) return null;
  return { tokenHash, session, user };
}

async function requireSession(sessionToken) {
  const session = await loadSession(sessionToken);
  if (!session) throw new Error("로그인이 필요합니다.");
  return session;
}

async function requireAdmin(sessionToken) {
  const session = await requireSession(sessionToken);
  if (String(session.user.role || "").toLowerCase() !== "admin") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session;
}

async function enforceRateLimit(event, action, identifier, limit, windowSeconds, blockSeconds) {
  const bucket = sha256(`${action}:${String(identifier || "").toLowerCase()}:${getClientIp(event)}`);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const attempt = await maybeSingle("auth_attempts", {
    select: "bucket,count,first_at,blocked_until",
    bucket: `eq.${bucket}`
  });

  if (attempt?.blocked_until && new Date(attempt.blocked_until).getTime() > now) {
    throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
  }

  const firstAt = attempt?.first_at ? new Date(attempt.first_at).getTime() : now;
  const outsideWindow = now - firstAt > windowSeconds * 1000;
  const nextCount = outsideWindow ? 1 : Number(attempt?.count || 0) + 1;
  const blockedUntil = nextCount > limit ? new Date(now + blockSeconds * 1000).toISOString() : null;

  await upsertRows("auth_attempts", [{
    bucket,
    action,
    count: nextCount,
    first_at: outsideWindow ? nowIso : attempt?.first_at || nowIso,
    last_at: nowIso,
    blocked_until: blockedUntil
  }], "bucket");

  if (blockedUntil) throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
}

async function sendResetEmail(toEmail, toName, code) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("비밀번호 재설정 이메일 환경변수가 없습니다.");
  }

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_name: toName,
        to_email: toEmail,
        message: `비밀번호 재설정을 위한 인증번호는 [ ${code} ] 입니다. ${RESET_CODE_MINUTES}분 안에 입력해주세요.`
      }
    })
  });
  if (!res.ok) throw new Error("인증번호 이메일 전송에 실패했습니다.");
}

async function handleAction(event, body) {
  const action = String(body.action || "");
  const requestSessionToken = getRequestSessionToken(event, body);

  if (action === "login") {
    const login = String(body.login || "").trim();
    const password = String(body.password || "");
    if (!login || !password) throw new Error("아이디와 비밀번호를 입력해주세요.");
    await enforceRateLimit(event, "login", login, 10, 10 * 60, 15 * 60);

    const user = await loadUserByLogin(login);
    if (!user) throw new Error("정보가 일치하지 않습니다.");
    const verified = verifyPassword(password, user.password);
    if (!verified.ok) throw new Error("정보가 일치하지 않습니다.");
    if (verified.normalized && verified.normalized !== user.password) {
      await updateRows("users", { username: `eq.${user.username}` }, { password: verified.normalized });
    }

    const session = await createSession(user.username);
    return response(200, { user: publicUser(user) }, { "Set-Cookie": makeSessionCookie(session.sessionToken) });
  }

  if (action === "signup") {
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const email = String(body.email || "").trim();
    const name = String(body.name || "").trim();
    const grade = Number.parseInt(String(body.grade || ""), 10);
    const classNum = Number.parseInt(String(body.classNum || ""), 10);
    const studentNumber = Number.parseInt(String(body.studentNumber || ""), 10);
    const schoolName = String(body.schoolName || "").trim();
    const atptCode = String(body.atptCode || "").trim();
    const schulCode = String(body.schulCode || "").trim();

    if (!username || !password || !email || !name || !grade || !classNum || !studentNumber || !schulCode) {
      throw new Error("모든 항목을 입력해주세요.");
    }
    await enforceRateLimit(event, "signup", email || username, 5, 60 * 60, 60 * 60);
    if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username)) {
      throw new Error("아이디는 3~40자의 영문, 숫자, _, ., - 만 사용할 수 있습니다.");
    }
    if (password.length < 8) throw new Error("비밀번호는 8자 이상이어야 합니다.");

    for (const [column, value] of [["username", username], ["email", email]]) {
      const existing = await maybeSingle("users", { select: "username", [column]: `eq.${value}` });
      if (existing) throw new Error("이미 사용 중인 아이디 또는 이메일입니다.");
    }

    await insertRows("users", [{
      username,
      password: hashPassword(password),
      email,
      name,
      grade,
      class_num: classNum,
      student_number: studentNumber,
      school_name: schoolName || null,
      atpt_ofcdc_sc_code: atptCode || null,
      sd_schul_code: schulCode,
      role: "user",
      auth_user_id: null,
      privacy_agreed_at: new Date().toISOString()
    }]);
    return response(200, { ok: true });
  }

  if (action === "session") {
    const session = await requireSession(requestSessionToken);
    return response(200, { user: publicUser(session.user) });
  }

  if (action === "logout") {
    if (requestSessionToken) await deleteRows("app_sessions", { token_hash: `eq.${sha256(requestSessionToken)}` });
    return response(200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
  }

  if (action === "changePassword") {
    const session = await requireSession(requestSessionToken);
    const newPassword = String(body.newPassword || "");
    if (newPassword.length < 8) throw new Error("비밀번호는 8자 이상이어야 합니다.");
    await updateRows("users", { username: `eq.${session.user.username}` }, { password: hashPassword(newPassword) });
    return response(200, { ok: true });
  }

  if (action === "adminSetTempPassword") {
    await requireAdmin(requestSessionToken);
    const username = String(body.username || "").trim();
    if (!username) throw new Error("대상 아이디가 없습니다.");
    const tempPassword = `temp-${randomToken(6)}`;
    await updateRows("users", { username: `eq.${username}` }, { password: hashPassword(tempPassword) });
    await deleteRows("app_sessions", { username: `eq.${username}` });
    return response(200, { tempPassword });
  }

  if (action === "adminCreateUser") {
    await requireAdmin(requestSessionToken);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim() || null;
    const role = cleanRole(body.role || "student");
    if (!username || !name) throw new Error("아이디와 이름은 필수입니다.");
    if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username)) throw new Error("아이디 형식이 올바르지 않습니다.");
    if (password && password.length < 8) throw new Error("비밀번호는 8자 이상이어야 합니다.");

    const payload = {
      username,
      name,
      email,
      grade: cleanNumber(body.grade),
      class_num: cleanNumber(body.classNum),
      student_number: cleanNumber(body.studentNumber),
      role
    };
    if (password) payload.password = hashPassword(password);
    await insertRows("users", [payload]);
    return response(200, { ok: true });
  }

  if (action === "adminUpdateRole") {
    await requireAdmin(requestSessionToken);
    const username = String(body.username || "").trim();
    const role = cleanRole(body.role);
    await updateRows("users", { username: `eq.${username}` }, { role });
    return response(200, { ok: true });
  }

  if (action === "adminBulkUpdateRole") {
    await requireAdmin(requestSessionToken);
    const usernames = cleanUsernames(body.usernames);
    const role = cleanRole(body.role);
    if (!usernames.length) throw new Error("대상 사용자가 없습니다.");
    await updateRows("users", { username: inFilter(usernames) }, { role });
    return response(200, { ok: true, count: usernames.length });
  }

  if (action === "adminDeleteUser") {
    const admin = await requireAdmin(requestSessionToken);
    const username = String(body.username || "").trim();
    if (!username) throw new Error("대상 아이디가 없습니다.");
    if (username === admin.user.username) throw new Error("현재 로그인한 관리자 계정은 삭제할 수 없습니다.");
    await deleteRows("users", { username: `eq.${username}` });
    await deleteRows("app_sessions", { username: `eq.${username}` });
    return response(200, { ok: true });
  }

  if (action === "adminUpdateUserInfo") {
    await requireAdmin(requestSessionToken);
    const username = String(body.username || "").trim();
    const updates = body.updates && typeof body.updates === "object" ? body.updates : {};
    const payload = {};
    if ("name" in updates) payload.name = String(updates.name || "").trim();
    if ("email" in updates) payload.email = String(updates.email || "").trim() || null;
    if ("grade" in updates) payload.grade = cleanNumber(updates.grade);
    if ("classNum" in updates) payload.class_num = cleanNumber(updates.classNum);
    if ("studentNumber" in updates) payload.student_number = cleanNumber(updates.studentNumber);
    if ("level" in updates) payload.level = cleanNumber(updates.level) || 1;
    if ("xp" in updates) payload.xp = cleanNumber(updates.xp) || 0;
    if ("coinBalance" in updates) payload.coin_balance = cleanNumber(updates.coinBalance) || 0;
    if (payload.name === "") throw new Error("이름은 필수입니다.");
    await updateRows("users", { username: `eq.${username}` }, payload);
    return response(200, { ok: true });
  }

  if (action === "adminGivePoints") {
    await requireAdmin(requestSessionToken);
    const username = String(body.username || "").trim();
    const amount = Number(body.amount);
    if (!username || !Number.isFinite(amount) || amount <= 0) throw new Error("포인트가 올바르지 않습니다.");
    const user = await maybeSingle("users", { select: "coin_balance", username: `eq.${username}` });
    if (!user) throw new Error("대상 사용자를 찾을 수 없습니다.");
    const next = (cleanNumber(user.coin_balance) || 0) + amount;
    await updateRows("users", { username: `eq.${username}` }, { coin_balance: next });
    return response(200, { ok: true, coinBalance: next });
  }

  if (action === "adminBulkGivePoints") {
    await requireAdmin(requestSessionToken);
    const usernames = cleanUsernames(body.usernames);
    const amount = Number(body.amount);
    if (!usernames.length || !Number.isFinite(amount) || amount <= 0) throw new Error("포인트가 올바르지 않습니다.");
    const users = await selectRows("users", { select: "username,coin_balance", username: inFilter(usernames) });
    for (const user of users || []) {
      const next = (cleanNumber(user.coin_balance) || 0) + amount;
      await updateRows("users", { username: `eq.${user.username}` }, { coin_balance: next });
    }
    return response(200, { ok: true, count: users?.length || 0 });
  }

  if (action === "adminPromoteStudents") {
    await requireAdmin(requestSessionToken);
    const students = await selectRows("users", { select: "username,grade", role: "eq.student" });
    let count = 0;
    for (const student of students || []) {
      const grade = cleanNumber(student.grade);
      if (grade === null || grade < 1 || grade > 2) continue;
      await updateRows("users", { username: `eq.${student.username}` }, { grade: grade + 1 });
      count += 1;
    }
    return response(200, { ok: true, count });
  }

  if (action === "adminUpsertUsers") {
    await requireAdmin(requestSessionToken);
    if (!Array.isArray(body.rows)) throw new Error("업로드할 행이 없습니다.");
    const rows = body.rows.slice(0, 1000).map((row) => ({
      username: String(row.username || "").trim(),
      name: String(row.name || "").trim(),
      email: String(row.email || "").trim() || null,
      grade: cleanNumber(row.grade),
      class_num: cleanNumber(row.class_num),
      student_number: cleanNumber(row.student_number),
      role: row.role ? cleanRole(row.role) : "student"
    })).filter((row) => row.username && row.name);
    if (!rows.length) throw new Error("업로드할 유효한 사용자가 없습니다.");
    await upsertRows("users", rows, "username");
    return response(200, { ok: true, count: rows.length });
  }

  if (action === "adminDeleteCareerResult") {
    await requireAdmin(requestSessionToken);
    if (body.id === undefined || body.id === null || body.id === "") throw new Error("삭제할 기록이 없습니다.");
    await deleteRows("career_test_results", { id: `eq.${body.id}` });
    return response(200, { ok: true });
  }

  if (action === "adminSyncInventory") {
    await requireAdmin(requestSessionToken);
    const username = String(body.username || "").trim();
    if (!username) throw new Error("대상 사용자가 없습니다.");
    const allItems = await selectRows("shop_items", { select: "id,name" });
    const myItems = await selectRows("inventory", { select: "item_id", username: `eq.${username}` });
    const owned = new Set((myItems || []).map((item) => item.item_id));
    const rows = (allItems || []).filter((item) => !owned.has(item.id)).map((item) => ({
      username,
      item_id: item.id,
      item_name: item.name,
      price: 0,
      purchased_at: new Date().toISOString()
    }));
    if (rows.length) await insertRows("inventory", rows);
    return response(200, { ok: true, count: rows.length });
  }

  if (action === "adminSaveShopItem") {
    await requireAdmin(requestSessionToken);
    const id = body.id === undefined || body.id === null || body.id === "" ? null : body.id;
    const item = body.item && typeof body.item === "object" ? body.item : {};
    const payload = {
      name: String(item.name || "").trim(),
      price: cleanNumber(item.price) || 0,
      item_type: String(item.item_type || "normal").trim() || "normal",
      effect_data: item.effect_data ? String(item.effect_data).trim() : null,
      image_url: item.image_url ? String(item.image_url).trim() : null,
      stock: cleanNumber(item.stock) || 1,
      description: item.description ? String(item.description).trim() : null
    };
    if (!payload.name) throw new Error("아이템 이름을 입력하세요.");
    if (id) await updateRows("shop_items", { id: `eq.${id}` }, payload);
    else await insertRows("shop_items", [payload]);
    return response(200, { ok: true });
  }

  if (action === "adminDeleteShopItem") {
    await requireAdmin(requestSessionToken);
    if (body.id === undefined || body.id === null || body.id === "") throw new Error("삭제할 아이템이 없습니다.");
    await deleteRows("shop_items", { id: `eq.${body.id}` });
    return response(200, { ok: true });
  }

  if (action === "adminLogAction") {
    const admin = await requireAdmin(requestSessionToken);
    const details = body.details && typeof body.details === "object" ? body.details : {};
    await insertRows("user_activity_logs", [{
      user_id: null,
      username: admin.user.username,
      email: admin.user.email || null,
      action: String(body.logAction || "").trim(),
      target: details.target || null,
      target_type: details.target_type || null,
      details,
      ip_address: getClientIp(event),
      user_agent: event.headers["user-agent"] || null
    }]);
    return response(200, { ok: true });
  }

  if (action === "requestPasswordReset") {
    const username = String(body.username || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    if (!username || !name || !email) throw new Error("모든 항목을 입력해주세요.");
    await enforceRateLimit(event, "password_reset_request", email || username, 5, 60 * 60, 60 * 60);
    const user = await maybeSingle("users", {
      select: "username,name,email",
      username: `eq.${username}`,
      name: `eq.${name}`,
      email: `eq.${email}`
    });
    if (!user) throw new Error("일치하는 회원 정보를 찾을 수 없습니다.");

    const resetId = crypto.randomUUID();
    const code = randomDigits();
    await insertRows("password_reset_requests", [{
      id: resetId,
      username,
      code_hash: sha256(code),
      expires_at: new Date(Date.now() + RESET_CODE_MINUTES * 60 * 1000).toISOString()
    }]);
    await sendResetEmail(email, name, code);
    return response(200, { resetId });
  }

  if (action === "confirmPasswordReset") {
    const resetId = String(body.resetId || "");
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!resetId || !code) throw new Error("인증번호를 입력해주세요.");
    await enforceRateLimit(event, "password_reset_confirm", resetId, 5, 10 * 60, 30 * 60);
    if (newPassword.length < 8) throw new Error("비밀번호는 8자 이상이어야 합니다.");
    const reset = await maybeSingle("password_reset_requests", {
      select: "id,username,code_hash,expires_at,used_at",
      id: `eq.${resetId}`
    });
    if (!reset || reset.used_at) throw new Error("유효하지 않은 인증 요청입니다.");
    if (new Date(reset.expires_at).getTime() < Date.now()) throw new Error("인증번호가 만료되었습니다.");
    if (sha256(code) !== reset.code_hash) throw new Error("인증번호가 일치하지 않습니다.");
    await updateRows("users", { username: `eq.${reset.username}` }, { password: hashPassword(newPassword) });
    await updateRows("password_reset_requests", { id: `eq.${resetId}` }, { used_at: new Date().toISOString() });
    await deleteRows("app_sessions", { username: `eq.${reset.username}` });
    return response(200, { ok: true });
  }

  throw new Error("지원하지 않는 인증 동작입니다.");
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(200, { ok: true });
  if (event.httpMethod !== "POST") return response(405, { error: "POST 요청만 지원합니다." });

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    return await handleAction(event, body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "인증 처리 중 오류가 발생했습니다.";
    return response(400, { error: message });
  }
};
