import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * POST /api/search/files
 * Search files in the workspace using rg (ripgrep)
 * Body: { query: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      );
    }

    // Use rg for workspace grep
    // Search in the workspace directory
    const workspaceDir = process.env.WORKSPACE_DIR || '/home/openclaw/.openclaw/workspace/jarvis/projects/helicarrier';
    
    // Run rg with the query, limit results to 50 for safety
    const { stdout } = await execPromise(`rg --max-columns=200 --max-columns-preview=200 -n -m 50 "${query}" "${workspaceDir}"`, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    // Parse rg output: path:line:content
    const results: Array<{ path: string; line: number; content: string }> = [];
    const lines = stdout.trim().split('\n').filter(line => line.length > 0);

    for (const line of lines) {
      // rg format: path:line:content
      const match = line.match(/^(.+?):(\d+):(.*)$/);
      if (match) {
        const [, path, lineNum, content] = match;
        results.push({
          path: path.replace(`${workspaceDir}/`, ''), // Make path relative
          line: parseInt(lineNum, 10),
          content,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search files:', error);
    return NextResponse.json(
      { error: 'Failed to search files' },
      { status: 500 }
    );
  }
}
