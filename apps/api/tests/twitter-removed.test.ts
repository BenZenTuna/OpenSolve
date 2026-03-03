import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Twitter/X Integration Removed', () => {

  it('twitter.service.ts should not exist', () => {
    const filePath = path.join(__dirname, '..', 'src', 'services', 'twitter.service.ts');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('no Twitter imports in server.ts', () => {
    const serverPath = path.join(__dirname, '..', 'src', 'server.ts');
    const content = fs.readFileSync(serverPath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('twitter');
  });

  it('no Twitter references in any route file', () => {
    const routesDir = path.join(__dirname, '..', 'src', 'routes');
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

    for (const file of routeFiles) {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
      expect(content.toLowerCase()).not.toContain('twitter');
    }
  });

  it('no Twitter references in any service file', () => {
    const servicesDir = path.join(__dirname, '..', 'src', 'services');
    const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));

    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
      expect(content.toLowerCase()).not.toContain('twitter');
    }
  });

  it('no Twitter env vars in env config', () => {
    const envPath = path.join(__dirname, '..', 'src', 'config', 'env.ts');
    const content = fs.readFileSync(envPath, 'utf-8');
    expect(content).not.toContain('TWITTER_CLIENT_ID');
    expect(content).not.toContain('TWITTER_CLIENT_SECRET');
    expect(content).not.toContain('TWITTER_CALLBACK_URL');
    expect(content).not.toContain('TWITTER_BEARER_TOKEN');
  });

});
