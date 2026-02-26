import { NextResponse } from 'next/server';

/**
 * GET /api/openclaw/version
 * Check npm registry for latest openclaw version
 */
export async function GET() {
  try {
    const packageName = 'openclaw';
    const registryUrl = `https://registry.npmjs.org/${packageName}/latest`;

    const res = await fetch(registryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`npm registry fetch failed: ${res.status}`);
    }

    const data = await res.json();
    
    // Return current version (from package.json) and latest version from npm
    return NextResponse.json({
      current: process.env.npm_package_version || 'unknown',
      latest: data.version || 'unknown',
      publishedAt: data.publish_time || 'unknown',
    });
  } catch (error) {
    console.error('Failed to check openclaw version:', error);
    return NextResponse.json(
      { error: 'Failed to check openclaw version' },
      { status: 500 }
    );
  }
}
