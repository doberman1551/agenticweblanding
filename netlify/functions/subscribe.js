exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
    }

    // --- Get Secrets and Configuration from Environment Variables ---
    const API_KEY = process.env.BEEHIIV_API_KEY;
    const PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID;
    // This new variable lets you control double opt-in from Netlify's dashboard
    // Set it to "on" or "off" in Netlify. If not set, it won't be sent to Beehiiv.
    const DOUBLE_OPT_OVERRIDE = process.env.BEEHIIV_DOUBLE_OPT_OVERRIDE; 

    if (!API_KEY || !PUBLICATION_ID) {
        console.error("Server configuration error: Missing Beehiiv credentials.");
        return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }

    const API_URL = `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/subscriptions`;

    // --- Construct the Beehiiv Request Body ---
    const requestBody = {
        email: email,
        reactivate_existing: true, // Very useful for testing!
        send_welcome_email: true,  // Set to true to send the welcome email
        utm_source: "Agentic Web Landing Page",
    };

    // Only add the override if you've specifically set it
    if (DOUBLE_OPT_OVERRIDE === 'on' || DOUBLE_OPT_OVERRIDE === 'off') {
        requestBody.double_opt_override = DOUBLE_OPT_OVERRIDE;
    }
    
    console.log('--- Calling Beehiiv API ---');
    console.log('Request Body Sent:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
    });
    
    const responseData = await response.json();
    
    console.log('Beehiiv API Status:', response.status);
    console.log('Beehiiv API Response:', JSON.stringify(responseData, null, 2));
    console.log('---------------------------');

    if (response.ok) {
        // Beehiiv call was successful
        return { statusCode: 201, body: JSON.stringify(responseData) };
    } else {
        // Beehiiv returned an error
        return { 
            statusCode: response.status, 
            body: JSON.stringify({ error: responseData.errors?.[0]?.message || 'Subscription failed.' }) 
        };
    }
  } catch (error) {
    console.error('Function execution error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'An unexpected error occurred.' }) };
  }
};