# Troubleshooting Google Maps API Issues

## REQUEST_DENIED Error

If you're seeing `REQUEST_DENIED` errors, follow these steps:

### Step 1: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Library"
4. Search for and enable these APIs:
   - ✅ **Places API (New)**
   - ✅ **Directions API**
   - ✅ **Maps SDK for Android**
   - ✅ **Maps SDK for iOS**

### Step 2: Check API Key Restrictions

1. Go to "APIs & Services" → "Credentials"
2. Click on your API key
3. Under "Application restrictions":
   - For development: Set to "None" temporarily
   - For production: Add your app's bundle ID
4. Under "API restrictions":
   - Select "Restrict key"
   - Choose the APIs you enabled above

### Step 3: Set Up Billing

1. Go to "Billing" in the left sidebar
2. Click "Link a billing account"
3. Add your payment method
4. **This is required for API usage**

### Step 4: Test the API Key

You can test your API key directly:

```bash
curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=starbucks&key=YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your actual key.

### Step 5: Check Console Logs

The app will now show detailed error messages. Check the console for:
- API response details
- Specific error messages
- Billing status

### Common Issues & Solutions

#### Issue: "API not enabled"
**Solution:** Enable the required APIs in Google Cloud Console

#### Issue: "Billing not enabled"
**Solution:** Set up billing for your Google Cloud project

#### Issue: "API key restricted"
**Solution:** Temporarily remove restrictions for testing, then add proper restrictions

#### Issue: "Quota exceeded"
**Solution:** Check your usage in Google Cloud Console

### Quick Fix Checklist

- [ ] Places API (New) enabled
- [ ] Directions API enabled
- [ ] Maps SDK for Android enabled
- [ ] Maps SDK for iOS enabled
- [ ] Billing set up
- [ ] API key not overly restricted
- [ ] API key is valid

### Testing the Fix

1. Restart your app: `npm start`
2. Try searching for a venue
3. Check console logs for detailed error messages
4. If still failing, test the API key directly with curl

### Fallback Behavior

The app will automatically fall back to mock data if the API fails, so you can still test the UI while fixing the API issues. 