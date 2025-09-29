-- FitSync Pro Test Accounts Creation Script
-- Run this after registering the accounts through the app

-- Update user roles for testing dashboards
UPDATE profiles 
SET role = 'admin',
    name = 'Admin User',
    bio = 'System Administrator',
    subscription = 'pro'
WHERE email = 'admin@fitsync.com';

UPDATE profiles 
SET role = 'coach',
    name = 'Coach John',
    bio = 'Certified Personal Trainer with 10+ years experience',
    subscription = 'premium',
    fitness_level = 'advanced'
WHERE email = 'coach@fitsync.com';

UPDATE profiles 
SET role = 'dietician',
    name = 'Dr. Sarah Nutrition',
    bio = 'Licensed Nutritionist and Dietician',
    subscription = 'premium',
    goals = ARRAY['weight_loss', 'muscle_gain']
WHERE email = 'nutritionist@fitsync.com';

UPDATE profiles 
SET role = 'user',
    name = 'Test User',
    bio = 'Fitness enthusiast',
    subscription = 'free',
    fitness_level = 'beginner',
    goals = ARRAY['weight_loss', 'endurance']
WHERE email = 'test@example.com';

-- Create some sample data for testing
INSERT INTO challenges (title, description, challenge_type, target_value, reward_points, created_by)
SELECT 
    '30-Day Fitness Challenge',
    'Complete 30 workouts in 30 days',
    'workouts',
    30,
    500,
    id
FROM profiles WHERE role = 'admin' LIMIT 1;

INSERT INTO workout_plans (name, description, difficulty, duration_weeks, created_by, is_public)
SELECT 
    'Beginner Full Body Workout',
    'Perfect starter plan for new fitness enthusiasts',
    'beginner',
    8,
    id,
    true
FROM profiles WHERE role = 'coach' LIMIT 1;

-- Grant some points to test users
UPDATE profiles SET points = 1250 WHERE role = 'user';
UPDATE profiles SET points = 2500 WHERE role = 'coach';
UPDATE profiles SET points = 3000 WHERE role = 'admin';

-- Add some workout history
INSERT INTO workout_sessions (user_id, started_at, completed_at, duration_minutes, calories_burned)
SELECT 
    id,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '45 minutes',
    45,
    300
FROM profiles WHERE role = 'user';