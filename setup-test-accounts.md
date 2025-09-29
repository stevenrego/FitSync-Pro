# 🚀 Test Account Setup Guide

## ⚠️ **Important: Accounts Must Be Created First**

The test credentials I provided don't exist yet. You need to create them first!

## 📝 **Step-by-Step Setup**

### **Step 1: Create Test Accounts**
Register each account through the app:

1. **Open the app** → Click "Create Account"
2. **Register accounts one by one:**

| Email | Password | Name |
|-------|----------|------|
| `test@example.com` | `123456` | Test User |
| `admin@fitsync.com` | `admin123456` | Admin User |
| `coach@fitsync.com` | `coach123456` | Coach John |
| `nutritionist@fitsync.com` | `nutritionist123456` | Dr. Sarah |

### **Step 2: Update User Roles in Supabase**
1. **Open Supabase Dashboard** → Table Editor → `profiles`
2. **Find each user** by email
3. **Update the `role` column:**
   - `test@example.com` → `user`
   - `admin@fitsync.com` → `admin` 
   - `coach@fitsync.com` → `coach`
   - `nutritionist@fitsync.com` → `dietician`

### **Step 3: Test Dashboard Access**
1. **Logout** if currently logged in
2. **Login** with any test account
3. **Auto-redirect** to appropriate dashboard

---

## 🔧 **Alternative: Quick Demo Account**

If you want to test immediately, try the **original demo account:**

```
Email: test@example.com
Password: 123456
Role: Regular User (will show main app tabs)
```

---

## 🐛 **Troubleshooting**

### **Still getting "Invalid Credentials"?**
1. **Double-check** email and password spelling
2. **Make sure** you completed registration
3. **Try** the demo account first: `test@example.com` / `123456`
4. **Check** Supabase → Authentication → Users to see if accounts exist

### **Account created but can't login?**
1. **Check** email verification (if enabled)
2. **Try** logout/login again
3. **Clear** app cache and restart

---

## 📱 **Testing Order**
1. ✅ **User Account** (`test@example.com`) → Main App
2. ✅ **Admin Account** → Admin Dashboard  
3. ✅ **Coach Account** → Coach Dashboard
4. ✅ **Nutritionist Account** → Nutritionist Dashboard

**Start with Step 1: Create the accounts first!** 🎯