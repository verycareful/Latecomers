// Supabase Edge Function: create-staff-user
// This function creates a new staff user with auth credentials and user_details
// Only callable by admin users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StaffUserInput {
    email: string
    password: string
    name: string
    staff_id: string
    department: string
    role: 'admin' | 'staff' | 'floor_staff'
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get authorization header
        const authHeader = req.headers.get('Authorization')

        // If no auth header, try to get from apikey header (Supabase sends it differently sometimes)
        const token = authHeader?.replace('Bearer ', '') || req.headers.get('apikey')

        if (!token) {
            return new Response(
                JSON.stringify({ error: 'No authorization token provided' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create client with the user's token
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get the requesting user
        const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !requestingUser) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized - invalid token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if the requesting user is an admin
        const { data: adminCheck, error: adminError } = await supabaseAdmin
            .from('user_details')
            .select('role')
            .eq('id', requestingUser.id)
            .single()

        if (adminError || adminCheck?.role !== 'admin') {
            return new Response(
                JSON.stringify({ error: 'Only admins can create staff users' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse the request body
        const { email, password, name, staff_id, department, role }: StaffUserInput = await req.json()

        // Validate required fields
        if (!email || !password || !name || !staff_id || !department || !role) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate role
        if (!['admin', 'staff', 'floor_staff'].includes(role)) {
            return new Response(
                JSON.stringify({ error: 'Invalid role. Must be admin, staff, or floor_staff' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if staff_id already exists
        const { data: existingStaff } = await supabaseAdmin
            .from('user_details')
            .select('staff_id')
            .eq('staff_id', staff_id)
            .single()

        if (existingStaff) {
            return new Response(
                JSON.stringify({ error: 'Staff ID already exists' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create the auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                user_role: role,
                full_name: name
            }
        })

        if (authError) {
            return new Response(
                JSON.stringify({ error: authError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create the user_details record
        const { error: detailsError } = await supabaseAdmin
            .from('user_details')
            .insert({
                id: authData.user.id,
                name,
                staff_id,
                department,
                role
            })

        if (detailsError) {
            // Rollback: delete the auth user if user_details insert fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            return new Response(
                JSON.stringify({ error: detailsError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    name,
                    staff_id,
                    department,
                    role
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
