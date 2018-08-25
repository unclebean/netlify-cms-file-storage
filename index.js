import Implementation from './src/implementation';

/**
 * Add extension hooks to global scope.
 */
if (typeof window !== 'undefined') {
  window.FileStorageBackend = Implementation;
}

export default FileStorageBackend;