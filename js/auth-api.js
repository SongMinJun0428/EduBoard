(function () {
  'use strict';

  function getEndpoint() {
    return window.EduConfig?.AUTH_API_ENDPOINT || '/.netlify/functions/eduboard-auth';
  }

  function getSessionToken() {
    return '';
  }

  function setSessionToken(token) {
    localStorage.removeItem('savedAuthToken');
  }

  function clearSession() {
    setSessionToken('');
    localStorage.removeItem('savedRole');
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedUserId');
    localStorage.removeItem('savedAuthUserId');
    localStorage.removeItem('savedEmail');
  }

  async function callAuth(action, payload = {}) {
    const response = await fetch(getEndpoint(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        action,
        ...payload
      })
    });

    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      body = null;
    }

    if (!response.ok || body?.error) {
      const message = body?.error || '인증 서버 요청에 실패했습니다.';
      throw new Error(message);
    }

    return body || {};
  }

  async function login(loginValue, password) {
    const result = await callAuth('login', { login: loginValue, password });
    setSessionToken('');
    return result;
  }

  async function getSession() {
    try {
      const result = await callAuth('session');
      return {
        user: result.user || null,
        sessionToken: null
      };
    } catch (err) {
      clearSession();
      return { user: null, sessionToken: null, error: err };
    }
  }

  async function logout() {
    try {
      await callAuth('logout');
    } catch (err) {
      console.warn('Custom logout skipped:', err);
    } finally {
      clearSession();
    }
  }

  async function changePassword(newPassword) {
    return callAuth('changePassword', { newPassword });
  }

  async function requestPasswordReset({ username, name, email }) {
    return callAuth('requestPasswordReset', { username, name, email });
  }

  async function confirmPasswordReset({ resetId, code, newPassword }) {
    return callAuth('confirmPasswordReset', { resetId, code, newPassword });
  }

  async function claimQuestReward(userQuestId, xpMultiplier = 1) {
    return callAuth('claimQuestReward', { userQuestId, xpMultiplier });
  }

  async function signup(profile) {
    return callAuth('signup', profile);
  }

  async function adminSetTempPassword(username) {
    return callAuth('adminSetTempPassword', { username });
  }

  async function adminCreateUser(profile) {
    return callAuth('adminCreateUser', profile);
  }

  async function adminUpdateRole(username, role) {
    return callAuth('adminUpdateRole', { username, role });
  }

  async function adminBulkUpdateRole(usernames, role) {
    return callAuth('adminBulkUpdateRole', { usernames, role });
  }

  async function adminDeleteUser(username) {
    return callAuth('adminDeleteUser', { username });
  }

  async function adminUpdateUserInfo(username, updates) {
    return callAuth('adminUpdateUserInfo', { username, updates });
  }

  async function adminGivePoints(username, amount) {
    return callAuth('adminGivePoints', { username, amount });
  }

  async function adminBulkGivePoints(usernames, amount) {
    return callAuth('adminBulkGivePoints', { usernames, amount });
  }

  async function adminPromoteStudents() {
    return callAuth('adminPromoteStudents');
  }

  async function adminUpsertUsers(rows) {
    return callAuth('adminUpsertUsers', { rows });
  }

  async function adminDeleteCareerResult(id) {
    return callAuth('adminDeleteCareerResult', { id });
  }

  async function adminSyncInventory(username) {
    return callAuth('adminSyncInventory', { username });
  }

  async function adminSaveShopItem(id, item) {
    return callAuth('adminSaveShopItem', { id, item });
  }

  async function adminDeleteShopItem(id) {
    return callAuth('adminDeleteShopItem', { id });
  }

  async function adminLogAction(logAction, details) {
    return callAuth('adminLogAction', { logAction, details });
  }

  window.EduAuth = {
    getSessionToken,
    setSessionToken,
    clearSession,
    login,
    getSession,
    logout,
    changePassword,
    signup,
    requestPasswordReset,
    confirmPasswordReset,
    claimQuestReward,
    adminSetTempPassword,
    adminCreateUser,
    adminUpdateRole,
    adminBulkUpdateRole,
    adminDeleteUser,
    adminUpdateUserInfo,
    adminGivePoints,
    adminBulkGivePoints,
    adminPromoteStudents,
    adminUpsertUsers,
    adminDeleteCareerResult,
    adminSyncInventory,
    adminSaveShopItem,
    adminDeleteShopItem,
    adminLogAction
  };
})();
