// Data Service Layer - Interface between UI and Firebase backend
// Follows Clean Architecture principles by decoupling data access from UI components

import {
  db,
  ref,
  onValue,
  set,
  update,
  remove,
  serverTimestamp,
  getProjectsRTDBRef
} from '@/lib/firebase.js';

/**
 * Listens for real-time changes to projects and executes callback with clean array
 * @param {string} userId - The user ID to fetch projects for
 * @param {function} callback - Callback function that receives array of projects
 * @returns {function} Unsubscribe function to stop listening
 */
const getProjects = (userId, callback) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }

  const projectsRef = getProjectsRTDBRef(userId);
  
  const unsubscribe = onValue(projectsRef, (snapshot) => {
    try {
      const data = snapshot.val();
      let projects = [];
      
      if (data) {
        // Convert snapshot object to clean array of project objects
        projects = Object.entries(data).map(([id, projectData]) => ({
          id,
          ...projectData,
          // Ensure timestamps are properly handled
          createdAt: projectData.createdAt || null,
          updatedAt: projectData.updatedAt || null
        }));
        
        // Sort projects by createdAt timestamp (newest first)
        projects.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      }
      
      callback(projects);
    } catch (error) {
      console.error('Error processing projects data:', error);
      callback([]);
    }
  }, (error) => {
    console.error('Error listening to projects:', error);
    callback([]);
  });
  
  return unsubscribe;
};

/**
 * Creates a new project with server timestamps
 * @param {string} userId - The user ID to create project for
 * @param {object} projectData - Project data (title, body, thumbnailUrl, videoUrl, galleryUrls)
 * @returns {Promise<string>} Promise that resolves with the new project ID
 */
const addProject = async (userId, projectData) => {
  try {
    const newProjectRef = ref(db, `users/${userId}/projects`).push();
    
    const projectWithTimestamps = {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await set(newProjectRef, projectWithTimestamps);
    
    console.log('Project created successfully with ID:', newProjectRef.key);
    return newProjectRef.key;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project: ' + error.message);
  }
};

/**
 * Updates an existing project with new data and updated timestamp
 * @param {string} userId - The user ID that owns the project
 * @param {string} projectId - The ID of the project to update
 * @param {object} projectData - Updated project data
 * @returns {Promise<void>}
 */
const updateProject = async (userId, projectId, projectData) => {
  try {
    const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
    
    const updateData = {
      ...projectData,
      updatedAt: serverTimestamp()
    };
    
    await update(projectRef, updateData);
    
    console.log('Project updated successfully:', projectId);
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project: ' + error.message);
  }
};

/**
 * Deletes a project entry
 * @param {string} userId - The user ID that owns the project
 * @param {string} projectId - The ID of the project to delete
 * @returns {Promise<void>}
 */
const deleteProject = async (userId, projectId) => {
  try {
    const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
    await remove(projectRef);
    
    console.log('Project deleted successfully:', projectId);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project: ' + error.message);
  }
};

/**
 * Gets a single project by ID
 * @param {string} userId - The user ID that owns the project
 * @param {string} projectId - The ID of the project to fetch
 * @returns {Promise<object>} Promise that resolves with the project data
 */
const getProjectById = async (userId, projectId) => {
  try {
    const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
    
    return new Promise((resolve, reject) => {
      onValue(projectRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          resolve({
            id: projectId,
            ...data
          });
        } else {
          reject(new Error('Project not found'));
        }
      }, (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new Error('Failed to fetch project: ' + error.message);
  }
};

// Export the data service functions
export {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getProjectById
};