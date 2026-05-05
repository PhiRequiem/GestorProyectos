import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, getDocs,
} from 'firebase/firestore'
import { db, auth } from '@/firebase'

export const useTasksStore = defineStore('tasks', () => {
  const lists = ref([])
  let unsubLists = null

  function subscribeLists() {
    if (unsubLists) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    const q = query(
      collection(db, 'taskLists'),
      where('ownerId', '==', uid)
    )
    unsubLists = onSnapshot(q, (snap) => {
      lists.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
    }, () => {})
  }

  function unsubscribeAll() {
    if (unsubLists) { unsubLists(); unsubLists = null }
    lists.value = []
  }

  async function createList(name, color = '#6366f1') {
    const uid = auth.currentUser?.uid
    if (!uid) return
    return await addDoc(collection(db, 'taskLists'), {
      name, color, ownerId: uid,
      createdAt: serverTimestamp(),
    })
  }

  async function renameList(listId, name) {
    await updateDoc(doc(db, 'taskLists', listId), { name })
  }

  async function deleteList(listId) {
    await deleteDoc(doc(db, 'taskLists', listId))
  }

  // --- Tasks within a list ---
  function subscribeTasks(listId, callback) {
    const q = query(
      collection(db, 'taskLists', listId, 'tasks'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, () => callback([]))
  }

  async function _syncPendingCount(listId) {
    const snap = await getDocs(collection(db, 'taskLists', listId, 'tasks'))
    const pending = snap.docs.filter((d) => !d.data().completed).length
    await updateDoc(doc(db, 'taskLists', listId), { pendingCount: pending })
  }

  async function addTask(listId, { text, priority = null, dueDate = null }) {
    await addDoc(collection(db, 'taskLists', listId, 'tasks'), {
      text, priority, dueDate, completed: false,
      createdAt: serverTimestamp(),
    })
    await _syncPendingCount(listId)
  }

  async function toggleTask(listId, taskId, completed) {
    await updateDoc(doc(db, 'taskLists', listId, 'tasks', taskId), { completed })
    await _syncPendingCount(listId)
  }

  async function deleteTask(listId, taskId) {
    await deleteDoc(doc(db, 'taskLists', listId, 'tasks', taskId))
    await _syncPendingCount(listId)
  }

  async function updateTask(listId, taskId, data) {
    await updateDoc(doc(db, 'taskLists', listId, 'tasks', taskId), data)
  }

  async function updateTask(listId, taskId, data) {
    await updateDoc(doc(db, 'taskLists', listId, 'tasks', taskId), data)
  }

  return {
    lists, subscribeLists, unsubscribeAll,
    createList, renameList, deleteList,
    subscribeTasks, addTask, toggleTask, deleteTask, updateTask,
  }
})
