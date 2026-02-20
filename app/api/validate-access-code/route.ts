import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const { code, walletAddress } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Missing access code' }, { status: 400 });
        }
        if (!walletAddress) {
            return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
        }

        // 1. Check if the code is valid and unused
        const { data: accessCode, error: fetchError } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (fetchError || !accessCode) {
            return NextResponse.json({ error: 'Invalid access code' }, { status: 404 });
        }

        if (accessCode.is_used) {
            return NextResponse.json({ error: 'This access code has already been used' }, { status: 400 });
        }

        // 2. Mark code as used and link to wallet
        const { error: updateCodeError } = await supabase
            .from('access_codes')
            .update({
                is_used: true,
                used_at: new Date().toISOString(),
                wallet_address: walletAddress
            })
            .eq('code', accessCode.code);

        if (updateCodeError) throw updateCodeError;

        // 3. Upsert user profile to ensure code is linked
        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
                user_address: walletAddress,
                access_code: accessCode.code,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_address' });

        if (profileError) {
            console.error('Profile upsert error:', profileError);
            // We still return success if the code was marked as used, 
            // but the profile link is important for state.
        }

        return NextResponse.json({ success: true, code: accessCode.code });
    } catch (error: any) {
        console.error('Validation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
