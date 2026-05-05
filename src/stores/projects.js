import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import { db, auth } from '@/firebase'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref([])
  const loading = ref(false)
  let unsubscribe = null

  function subscribe() {
    if (unsubscribe) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    loading.value = true
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    )
    unsubscribe = onSnapshot(
      q,
      (snap) => {
        projects.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        loading.value = false
      },
      () => {
        loading.value = false
      }
    )
  }

  function unsubscribeAll() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    projects.value = []
    loading.value = false
  }

  async function createProject(data) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('No autenticado')
    await addDoc(collection(db, 'projects'), {
      ...data,
      ownerId: uid,
      status: data.status || 'active',
      priority: data.priority || 'medium',
      notes: data.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function updateProject(id, data) {
    await updateDoc(doc(db, 'projects', id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteProject(id) {
    await deleteDoc(doc(db, 'projects', id))
  }

  // --- Todos ---
  async function getTodos(projectId) {
    const snap = await getDocs(
      query(collection(db, 'projects', projectId, 'todos'), orderBy('createdAt', 'asc'))
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  function subscribeTodos(projectId, callback) {
    const q = query(
      collection(db, 'projects', projectId, 'todos'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }

  async function addTodo(projectId, text) {
    await addDoc(collection(db, 'projects', projectId, 'todos'), {
      text,
      completed: false,
      createdAt: serverTimestamp(),
    })
    await _syncTodosCount(projectId)
  }

  async function toggleTodo(projectId, todoId, completed) {
    await updateDoc(doc(db, 'projects', projectId, 'todos', todoId), { completed })
  }

  async function updateTodo(projectId, todoId, text) {
    await updateDoc(doc(db, 'projects', projectId, 'todos', todoId), { text })
  }

  async function deleteTodo(projectId, todoId) {
    await deleteDoc(doc(db, 'projects', projectId, 'todos', todoId))
    await _syncTodosCount(projectId)
  }

  async function _syncTodosCount(projectId) {
    const snap = await getDocs(collection(db, 'projects', projectId, 'todos'))
    await updateDoc(doc(db, 'projects', projectId), {
      todosCount: snap.size,
      updatedAt: serverTimestamp(),
    })
  }

  // --- Milestones ---
  function subscribeMilestones(projectId, callback) {
    const q = query(
      collection(db, 'projects', projectId, 'milestones'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }

  async function addMilestone(projectId, data) {
    await addDoc(collection(db, 'projects', projectId, 'milestones'), {
      ...data,
      paid: false,
      createdAt: serverTimestamp(),
    })
  }

  async function toggleMilestone(projectId, milestoneId, paid) {
    await updateDoc(doc(db, 'projects', projectId, 'milestones', milestoneId), { paid })
    // Recalculate exact sum from source of truth — avoid increment drift
    const snap = await getDocs(collection(db, 'projects', projectId, 'milestones'))
    const milestonesCollected = snap.docs.reduce((sum, d) => {
      const data = d.data()
      // Use the updated value for the toggled doc
      const isPaid = d.id === milestoneId ? paid : data.paid
      return sum + (isPaid ? (data.amount || 0) : 0)
    }, 0)
    await updateDoc(doc(db, 'projects', projectId), {
      milestonesCollected,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteMilestone(projectId, milestoneId) {
    await deleteDoc(doc(db, 'projects', projectId, 'milestones', milestoneId))
    // Recalculate after delete so milestonesCollected stays accurate
    const snap = await getDocs(collection(db, 'projects', projectId, 'milestones'))
    const milestonesCollected = snap.docs.reduce((sum, d) => {
      const data = d.data()
      return sum + (data.paid ? (data.amount || 0) : 0)
    }, 0)
    await updateDoc(doc(db, 'projects', projectId), { milestonesCollected, updatedAt: serverTimestamp() })
  }

  // --- Documents ---
  function subscribeDocuments(projectId, callback) {
    const q = query(
      collection(db, 'projects', projectId, 'documents'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }

  async function addDocument(projectId, data) {
    await addDoc(collection(db, 'projects', projectId, 'documents'), {
      ...data,
      createdAt: serverTimestamp(),
    })
    await _syncDocsCount(projectId)
  }

  async function deleteDocument(projectId, docId) {
    await deleteDoc(doc(db, 'projects', projectId, 'documents', docId))
    await _syncDocsCount(projectId)
  }

  async function _syncDocsCount(projectId) {
    const snap = await getDocs(collection(db, 'projects', projectId, 'documents'))
    await updateDoc(doc(db, 'projects', projectId), {
      docsCount: snap.size,
      updatedAt: serverTimestamp(),
    })
  }

  return {
    projects,
    loading,
    subscribe,
    unsubscribeAll,
    createProject,
    updateProject,
    deleteProject,
    subscribeTodos,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    subscribeMilestones,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    subscribeDocuments,
    addDocument,
    deleteDocument,
  }
})
