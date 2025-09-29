# FitSync Pro - Dashboard Access Guide

## 🎯 Dashboard Access Methods

### **Method 1: Role-Based Auto-Redirect (After Login)**
After logging in, users are automatically redirected based on their role:
- **Admin** → `/admin-dashboard`
- **Coach** → `/coach-dashboard` 
- **Dietician** → `/nutritionist-dashboard`
- **User** → `/(tabs)` (Main App)

### **Method 2: Direct Navigation URLs**
For testing purposes, you can navigate directly to:
```
http://localhost:8081/admin-dashboard
http://localhost:8081/coach-dashboard  
http://localhost:8081/nutritionist-dashboard
```

---

## 👥 Test Accounts & Credentials

### **Admin Dashboard Access**
```
Email: admin@fitsync.com
Password: admin123456
Role: admin
Features: User management, analytics, challenge creation, system settings
```

### **Coach Dashboard Access**
```
Email: coach@fitsync.com
Password: coach123456
Role: coach
Features: Client management, workout plan creation, progress tracking
```

### **Nutritionist Dashboard Access** 
```
Email: nutritionist@fitsync.com
Password: nutritionist123456
Role: dietician
Features: Meal plan creation, nutrition tracking, client dietary analysis
```

### **Regular User Access**
```
Email: test@example.com
Password: 123456
Role: user
Features: Standard app experience, workouts, nutrition, community
```

---

## 🧪 Testing Instructions

### **Step 1: Create Test Accounts**
1. **Register new accounts** with the emails above
2. **Manually update roles** in Supabase database:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@fitsync.com';
   UPDATE profiles SET role = 'coach' WHERE email = 'coach@fitsync.com';  
   UPDATE profiles SET role = 'dietician' WHERE email = 'nutritionist@fitsync.com';
   ```

### **Step 2: Test Dashboard Access**
1. **Login** with any test account
2. **Auto-redirect** to appropriate dashboard
3. **Test features** specific to each role
4. **Logout and switch** between different roles

### **Step 3: Manual Navigation (If Needed)**
If auto-redirect doesn't work:
1. **Login** with any account
2. **Manually navigate** to dashboard URLs above
3. **Access control** will verify role permissions

---

## 🔧 Dashboard Features by Role

### **Admin Dashboard**
- ✅ User management (view, edit, delete users)
- ✅ Role assignment (promote users to coach/dietician)
- ✅ Challenge creation and management
- ✅ System analytics and reporting
- ✅ Content moderation
- ✅ Subscription management

### **Coach Dashboard**
- ✅ Client list and management
- ✅ Workout plan creation and assignment
- ✅ Client progress tracking
- ✅ AI-powered plan generation
- ✅ Revenue and client analytics
- ✅ Messaging with clients

### **Nutritionist Dashboard**  
- ✅ Client nutrition tracking
- ✅ Meal plan creation and customization
- ✅ Dietary analysis and reporting
- ✅ Food database management
- ✅ Nutrition goal setting
- ✅ Client adherence monitoring

---

## 🚨 Troubleshooting

### **Dashboard Not Loading?**
1. **Check user role** in database
2. **Clear app cache** and restart
3. **Try manual navigation** to dashboard URL
4. **Check console** for authentication errors

### **Access Denied?**
1. **Verify user role** matches required permissions
2. **Refresh user profile** (logout/login)
3. **Check RLS policies** in Supabase

### **Features Not Working?**
1. **Check internet connection**
2. **Verify Supabase configuration**
3. **Review console errors**
4. **Try different test account**

---

## 📱 Platform Notes

- **Mobile App**: Dashboards work on mobile devices
- **Web Preview**: Full functionality in web browser
- **Responsive Design**: Optimized for all screen sizes
- **Real-time Updates**: Live data synchronization

**Ready to test! Start by logging in with any of the test accounts above.** 🚀