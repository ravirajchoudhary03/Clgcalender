# Deployment Guide

## Backend Deployment (Render)

### Prerequisites
- Backend code pushed to GitHub
- MongoDB Atlas account set up
- Render account

### Steps

#### 1. Connect GitHub
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub account
4. Select `calender` repository

#### 2. Configure Web Service
- **Name**: `college-organizer-api`
- **Environment**: Node
- **Region**: Pick closest to you
- **Branch**: main
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### 3. Add Environment Variables
Click "Environment" and add:
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/college-organizer?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_change_this_in_production
```

#### 4. Deploy
- Click "Deploy"
- Wait for build to complete
- Copy your backend URL: `https://your-service-name.onrender.com`

### Verify Deployment
```bash
curl https://your-backend-url/
# Should return: College Organizer Backend

curl https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Should return error (not found) not CORS error
```

---

## Frontend Deployment (Vercel)

### Prerequisites
- Frontend code pushed to GitHub
- Backend deployed and URL available
- Vercel account

### Steps

#### 1. Connect GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select GitHub repo
4. Select `frontend` as root directory

#### 2. Configure Project
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3. Add Environment Variables
- **VITE_API_URL**: `https://your-backend-url.onrender.com/api`

#### 4. Deploy
- Click "Deploy"
- Vercel auto-builds and deploys
- Get your frontend URL: `https://your-app.vercel.app`

### Verify Deployment
1. Visit `https://your-app.vercel.app`
2. Should see login page
3. Try login with `student@example.com / password123`

---

## Seed Data in Production

After backend deployment, populate with demo data:

```bash
# Get SSH access or use Render shell
npm run seed

# Or curl (requires endpoint - add to backend if needed)
```

Alternatively, add seed route to backend:
```javascript
// backend/src/routes/seed.js
router.post('/seed', async (req, res) => {
  const SECRET = req.headers['x-seed-secret'];
  if (SECRET !== process.env.SEED_SECRET) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    await seedData(); // reuse seed logic
    res.json({ message: 'Seeded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

Then call from frontend or curl with secret.

---

## Environment Variables Reference

### Backend (.env)
```
# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/college-organizer?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_secret_key_here_at_least_32_chars
```

### Frontend (.env)
```
# API URL
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Monitoring & Logs

### Render Backend Logs
- Dashboard → Your Service → Logs tab
- View real-time logs

### Vercel Frontend
- Dashboard → Project → Deployments tab
- View build logs
- Check Functions tab for API errors

---

## Troubleshooting Deployment

### Backend won't start
1. Check `npm start` works locally: `npm start`
2. Verify MONGO_URI is correct
3. Check JWT_SECRET is set
4. View Render logs for errors

### Frontend shows blank/error
1. Check VITE_API_URL in Vercel environment
2. Verify backend is running and accessible
3. Check browser console for CORS errors
4. Verify API endpoint: `curl https://backend/api/auth/login`

### Can't login after deploy
1. Seed backend data: `npm run seed` (locally or via endpoint)
2. Check email/password match seed data
3. Verify JWT_SECRET is same on backend

### CORS errors
Backend needs:
```javascript
const cors = require('cors');
app.use(cors());
```

This is already in the starter code.

---

## Custom Domain

### Render Backend
1. Go to Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Add CNAME record to your DNS

### Vercel Frontend
1. Go to Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow Vercel's DNS setup

---

## Cost Estimate

- **Render**: Free tier = $0 (with hobby tier after 15 mins idle)
- **Vercel**: Free tier = $0 (generous limits)
- **MongoDB Atlas**: Free tier = $0 (512MB storage)

**Total: $0** for low-traffic student project

---

## CI/CD

Both Render and Vercel auto-deploy on push to main:

1. Push code to GitHub
2. Service rebuilds and deploys
3. Live in ~2-5 minutes

No manual deployment needed!

---

## Database Backup

### MongoDB Atlas Backup
1. Go to your cluster
2. Click "Backup" tab
3. Configure automated backups
4. Can restore snapshots anytime

---

## Next Steps After Deployment

1. ✅ Test login with seed credentials
2. ✅ Add new habit/subject
3. ✅ Check attendance page loads
4. ✅ Add schedule entry
5. ✅ View dashboard
6. ✅ Mark attendance for today
7. ✅ Monitor logs for errors
8. ✅ Share app link with friends!

Deployed app is production-ready for small user bases. For large scale:
- Add caching (Redis)
- Use CDN for frontend
- Optimize DB queries
- Add API rate limiting
