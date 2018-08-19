import FileStorageBackend from './src/implementation';

/**
 * Add extension hooks to global scope.
 */
if (typeof window !== 'undefined') {
  window.FileStorageBackend = FileStorageBackend;
}

export default FileStorageBackend;