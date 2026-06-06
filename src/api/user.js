import request from '@/utils/request'

export function login(data) {
  return request.post('/user', { action: 'login', data })
}

export function getUserInfo() {
  return request.post('/user', { action: 'getUserInfo', data: {} })
}

export function updatePassword(data) {
  return request.post('/user', { action: 'updatePassword', data })
}

export function getUsers() {
  return request.post('/user', { action: 'getUsers', data: {} })
}

export function createUser(data) {
  return request.post('/user', { action: 'createUser', data })
}

export function updateUser(data) {
  return request.post('/user', { action: 'updateUser', data })
}

export function deleteUser(data) {
  return request.post('/user', { action: 'deleteUser', data })
}

export function resetUserPassword(data) {
  return request.post('/user', { action: 'resetPassword', data })
}
