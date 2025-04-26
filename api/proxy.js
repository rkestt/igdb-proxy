export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // ATTENZIONE: "*" va bene solo in test!
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Now handle the real request
  try {
    // Extract search and fields from request body
    const { search, fields } = req.body;
    
    // Ensure we have the required environment variables
    if (!process.env.CLIENT_ID || !process.env.ACCESS_TOKEN) {
      throw new Error('Missing IGDB API credentials');
    }
    
    // Create the IGDB query - this is the most critical part
    // IGDB expects a specific query format, not a JSON object
    const queryBody = `search "${search}"; ${fields ? `fields ${fields};` : 'fields name,cover.url,platforms.name,release_dates.date,rating;'}`;
    
    console.log('Sending query to IGDB:', queryBody);
    
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.CLIENT_ID,
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain', // IGDB API expects text/plain for the query
      },
      body: queryBody,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB API error:', response.status, errorText);
      throw new Error(`IGDB API responded with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch from IGDB API' });
  }
}
