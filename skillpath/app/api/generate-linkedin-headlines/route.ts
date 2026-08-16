import { NextRequest } from 'next/server';
import { runDeprecatedGeneratorRoute } from '@/lib/api/deprecated-generator-route';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) { return runDeprecatedGeneratorRoute(req, 'linkedin-headlines'); }

