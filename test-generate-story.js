const testGenerateStory = async () => {
  const payload = {
    story_id: "test-story-123",
    theme: "un paseo por el mar muerto",
    characters: [{
      id: "test-char-123",
      name: "Test Character",
      age: "5",
      thumbnailUrl: "http://test.com/image.png"
    }]
  };

  console.log('Enviando request de prueba...');
  
  try {
    const response = await fetch("http://127.0.0.1:54321/functions/v1/generate-story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
};

testGenerateStory();