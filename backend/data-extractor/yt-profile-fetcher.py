import os
import json
import subprocess
from dotenv import load_dotenv
from google import genai

# 1. Load Environment & Initialize Gemini
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_youtube_metadata(handle_url):
    # Ensure URL ends with /videos to find the list
    if not handle_url.endswith('/videos'):
        handle_url = handle_url.rstrip('/') + '/videos'
        
    print(f"🔍 Harvesting data from {handle_url}...")
    
    # Updated command:
    # --flat-playlist: Just get metadata, don't try to open every video (MUCH faster)
    # --dump-single-json: Gets the whole channel's video list metadata in one go
    cmd = [
        'yt-dlp',
        '--quiet',
        '--no-warnings',
        '--playlist-items', '5',
        '--flat-playlist',
        '--print', '%(title)s || %(url)s || %(view_count)s',
        handle_url
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        output = result.stdout.strip()
        
        # Debugging: check if we actually got something
        if not output:
            print("⚠️ yt-dlp returned nothing. Trying fallback method...")
            # Fallback for some yt-dlp versions
            cmd_fallback = ['yt-dlp', '--get-title', '--playlist-items', '5', handle_url]
            result = subprocess.run(cmd_fallback, capture_output=True, text=True)
            output = result.stdout.strip()
        
        print(output)
        return output
    except Exception as e:
        return f"Error: {str(e)}"

def analyze_creator_intelligence(raw_data):
    print("🧠 Analyzing with Gemini...")
    
    prompt = f"""
        You are a professional Social Media Strategist. Analyze the following raw Youtube metadata from a specific creator and provide a 'Creator Intelligence Report'.
        RAW DATA:
        {raw_data}
        
        REPORT REQUIREMEMTS:
            - Primary Niche: Identify the primary niche of the creator. 
            - Secondary Niches: Identify any secondary niches the creator may have.
            - Content Focus: What are the main content themes the creator focuses on?
            - Hook Style/Strategy: What is the creator's hook style or strategy? How do they start their titles/descriptions/tags to grab attention?
            - Engagment Analysis: Based on the view counts vs topics, what is the most viral content type? Like in real time trend of the same content type.
            - Improvement Gap: What are the gaps in the creator's content strategy that need to be addressed?
            
            Format the output in clean Markdown for a dashboard.
        """
        
    # Using the latest google-genai syntax (Gemini 1.5 Flash for speed/cost)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        verbose=True
    )
    return response.text

# --- EXECUTION ---
channel_url = "https://www.youtube.com/@swayamdhadange-t5v"
raw_metadata = get_youtube_metadata(channel_url)

if "Error" not in raw_metadata:
    intelligence_report = analyze_creator_intelligence(raw_metadata)
    print("\n" + "="*30 + "\n REACHRADAR INTELLIGENCE REPORT \n" + "="*30)
    print(intelligence_report)
else:
    print(raw_metadata)