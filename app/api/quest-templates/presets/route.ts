import { NextResponse } from 'next/server';
import { presetTemplates } from '@/lib/preset-templates';

export async function GET() {
  return NextResponse.json(presetTemplates);
}
