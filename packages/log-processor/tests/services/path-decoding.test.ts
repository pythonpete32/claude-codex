import { describe, it, expect } from 'vitest';

// Test the path decoding logic directly
function decodeProjectPath(encoded: string): string {
  let decoded = encoded;

  // Handle Windows drive letters (e.g., C--Users becomes C:/Users)
  if (decoded.match(/^[A-Z]--/)) {
    decoded = decoded.replace(/^([A-Z])--/, '$1:/');
  }
  // Handle Unix paths (e.g., -Users becomes /Users)
  else if (decoded.startsWith('-')) {
    decoded = '/' + decoded.slice(1);
  }

  // Replace double dashes with dots first (before single dash replacement)
  decoded = decoded.replace(/--/g, '\u0000DOT\u0000'); // Temporary placeholder

  // Replace remaining dashes with slashes
  decoded = decoded.replace(/-/g, '/');

  // Replace placeholder with dots
  decoded = decoded.replace(/\u0000DOT\u0000/g, '.');

  return decoded;
}

describe('Path Decoding', () => {
  it('should decode Unix paths correctly', () => {
    expect(decodeProjectPath('-Users-john-projects')).toBe(
      '/Users/john/projects'
    );
    expect(decodeProjectPath('-home-user-work')).toBe('/home/user/work');
    expect(decodeProjectPath('-var-log-app')).toBe('/var/log/app');
  });

  it('should decode Windows paths correctly', () => {
    expect(decodeProjectPath('C--Users-jane-work')).toBe('C:/Users/jane/work');
    expect(decodeProjectPath('D--Projects-app')).toBe('D:/Projects/app');
    expect(decodeProjectPath('C--drive-folder')).toBe('C:/drive/folder');
  });

  it('should handle dots in filenames', () => {
    expect(decodeProjectPath('-home-user-my--config')).toBe(
      '/home/user/my.config'
    );
    expect(decodeProjectPath('-Users-john-app--v1--2')).toBe(
      '/Users/john/app.v1.2'
    );
    expect(decodeProjectPath('C--Users-file--name--with--dots')).toBe(
      'C:/Users/file.name.with.dots'
    );
  });

  it('should handle complex paths', () => {
    expect(decodeProjectPath('-usr-local-my--awesome--project')).toBe(
      '/usr/local/my.awesome.project'
    );
    expect(decodeProjectPath('E--Dev-super--cool--app--v2')).toBe(
      'E:/Dev/super.cool.app.v2'
    );
  });
});
