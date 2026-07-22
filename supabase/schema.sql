-- ==============================================================================
-- 1. EXTENSIONS & ENUMS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE video_provider AS ENUM ('vimeo', 'bunny', 'youtube_unlisted');
CREATE TYPE enrollment_status AS ENUM ('active', 'expired', 'pending');

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- A. users (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    whatsapp_number TEXT,
    role user_role DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. courses
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. modules
CREATE TABLE public.modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. lessons
CREATE TABLE public.lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_provider video_provider NOT NULL,
    video_id TEXT NOT NULL,
    content_body TEXT,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. attachments
CREATE TABLE public.attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. enrollments
CREATE TABLE public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    status enrollment_status DEFAULT 'pending',
    payment_gateway TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- G. user_progress
CREATE TABLE public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, lesson_id)
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 1. Users can only read and update their own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- 2. Courses are visible to everyone if published
CREATE POLICY "Published courses are viewable by everyone" 
ON public.courses FOR SELECT 
USING (is_published = true);

-- 3. Modules are visible to everyone (assuming courses are published)
CREATE POLICY "Modules are viewable by everyone" 
ON public.modules FOR SELECT 
USING (true);

-- 4. Lessons RLS: 
-- Can view if is_preview is true OR if the user has an active enrollment for the course
CREATE POLICY "Users can view preview or enrolled lessons"
ON public.lessons FOR SELECT
USING (
    is_preview = true OR 
    EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.modules m ON m.course_id = e.course_id
        WHERE m.id = public.lessons.module_id 
        AND e.user_id = auth.uid() 
        AND e.status = 'active'
    )
);

-- 5. Attachments RLS:
-- Same logic as lessons, only enrolled users can access attachments of non-preview lessons
CREATE POLICY "Users can view attachments of enrolled lessons"
ON public.attachments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.lessons l
        LEFT JOIN public.modules m ON m.id = l.module_id
        LEFT JOIN public.enrollments e ON e.course_id = m.course_id
        WHERE l.id = public.attachments.lesson_id
        AND (l.is_preview = true OR (e.user_id = auth.uid() AND e.status = 'active'))
    )
);

-- 6. Enrollments: Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
ON public.enrollments FOR SELECT
USING (auth.uid() = user_id);

-- 7. User Progress: Users can view and update their own progress
CREATE POLICY "Users can view own progress"
ON public.user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. TRIGGERS
-- ==============================================================================
-- Auto-create user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
