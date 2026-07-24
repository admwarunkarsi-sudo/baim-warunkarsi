import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  // Hanya menerima metode POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("Received Mayar Webhook:", JSON.stringify(payload, null, 2));

    // Sesuaikan ekstraksi field sesuai payload standar Mayar
    const email = payload.customer?.email || payload.customer_email || payload.email;
    const name = payload.customer?.name || payload.customer_name || payload.name || "Member";
    const phone = payload.customer?.phone || payload.customer_phone || payload.phone || "";
    const status = payload.status || payload.transaction_status || payload.data?.status;

    if (!email) {
      console.log("No email in payload. This might be a test ping from Mayar.");
      return new Response(JSON.stringify({ message: "Payload received but no email found. Ignored." }), { status: 200 });
    }

    // Hanya proses jika status berhasil/settled
    if (status !== 'settled' && status !== 'paid' && status !== 'success' && status !== 'COMPLETED') {
      console.log(`Transaction status is ${status}. Ignoring.`);
      return new Response(JSON.stringify({ message: `Ignored status: ${status}` }), { status: 200 });
    }

    // Inisialisasi Supabase Admin Client menggunakan Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Cek apakah user sudah terdaftar di Supabase Auth
    let userId = null;
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find((u: any) => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
      console.log(`User exists with ID: ${userId}`);
    } else {
      // 2. Buat User Baru jika belum terdaftar
      // Buat password default: 'Baim' + 4 digit terakhir nomor WA (atau 1234 jika kosong)
      const phoneStr = String(phone).replace(/\D/g, "");
      const phoneSuffix = phoneStr.length >= 4 ? phoneStr.slice(-4) : "1234";
      const defaultPassword = `Baim${phoneSuffix}`;

      console.log(`Creating new user for ${email}`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: defaultPassword,
        email_confirm: true, // Otomatis konfirmasi email
        user_metadata: { full_name: name, whatsapp_number: phone }
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = newUser.user.id;
      console.log(`New user created with ID: ${userId}`);
    }

    // 3. Pastikan data di tabel 'users' sinkron (jika ada trigger, mungkin sudah masuk, tapi kita UPSERT untuk aman)
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        full_name: name,
        whatsapp_number: phone
      });
      
    if (userError) {
      console.error("Warning: Failed to upsert user profile:", userError.message);
    }

    // 4. Update Akses Member di tabel 'kelas_members'
    // Upsert status menjadi 'active'
    const { error: memberError } = await supabase
      .from('kelas_members')
      .upsert({
        user_id: userId,
        status: 'active',
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (memberError) {
      throw new Error(`Failed to activate member access: ${memberError.message}`);
    }

    console.log(`Successfully activated member access for ${email}`);
    return new Response(JSON.stringify({ success: true, message: "Member access activated successfully" }), { status: 200 });

  } catch (err: any) {
    console.error("Webhook Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
