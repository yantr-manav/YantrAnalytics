

import os
import json
import subprocess
from dotenv import load_dotenv
from google import genai

load_dotenv()
# Using gemini-1.5-flash for the best balance of speed and reasoning
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def fetch_tab_data(base_url, tab_name, limit=20):
    target_url = f"{base_url}/{tab_name}"
    print(f"📡 Scanning {tab_name.upper()} at {target_url}...")
    
    cmd = [
        'yt-dlp',
        '--quiet',
        '--no-warnings',
        '-j',
        '--flat-playlist',
        '--playlist-end', str(limit),
        target_url
    ]
    
    items = []
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)
        for line in process.stdout:
            item = json.loads(line)
            items.append({
                "title": item.get("title") or item.get("description", "No Title")[:50],
                "views": item.get("view_count", 0),
                "url": item.get("url") or f"https://www.youtube.com/watch?v={item.get('id')}",
                "date": item.get("upload_date")
            })
        process.wait()
        return items
    except Exception as e:
        print(f"⚠️ Error in {tab_name}: {e}")
        return []

def run_deep_intelligence(handle):
    base_url = f"https://www.youtube.com/{handle}"
    
    # 1. Aggregated Data Collection
    videos = fetch_tab_data(base_url, "videos")
    shorts = fetch_tab_data(base_url, "shorts")
    # Note: Community posts are under /community, but yt-dlp sees them as entries
    posts = fetch_tab_data(base_url, "community", limit=10) 

    intelligence_packet = {
        "handle": handle,
        "video_sample": videos[:15],
        "shorts_sample": shorts[:15],
        "community_sample": posts[:10]
    }

    # 2. Advanced Strategic Prompting
    prompt = f"""
    Act as a Senior Social Media Consultant and Data Scientist. 
    Analyze this raw metadata for the YouTube channel: {handle}.
    
    RAW DATA PACKET:
    {json.dumps(intelligence_packet, indent=2)}
    
    CONDUCT A MULTI-LAYERED STRATEGIC ANALYSIS:
    
    1. MARKET POSITIONING & NICHE:
       - What is the precise 'Sub-Niche'? 
       - What is the 'Channel Authority' (Expert vs. Entertainer vs. Curator)?
    
    2. CONTENT ENGINE DIAGNOSTICS:
       - Compare performance: Do Shorts drive more raw views than Long-form provides depth?
       - Analyze 'Community' Engagement: What is the tone of their direct audience interaction?
    
    3. COMPETITIVE MOAT (The 'Why'):
       - Why do people subscribe to THIS creator specifically? Identify the 'Unique Selling Proposition' (USP).
    
    4. GROWTH & REVENUE BLUEPRINT:
       - CONTENT GAP: What high-value topic is currently missing from their feed?
       - HOOK OPTIMIZATION: Based on titles, suggest a 'Level Up' for their CTR.
       - MONETIZATION: Suggest 2 digital products or services this creator could sell to this specific audience.
    
    5. THE 'VIRAL' SCRIPT IDEA:
       - Provide a specific 60-second Short script 'Hook' and 'Outline' based on their top-performing patterns.
    
    Output in professional Markdown with clear headings and executive summaries.
    """

    print("🧠 Synthesizing overall intelligence...")
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=prompt
    )
    return response.text

# --- EXECUTION ---
# You can now just pass the handle, e.g., "@swayamdhadange-t5v"
# user_handle = "@swayamdhadange-t5v"
user_handle = "@mandalamagicthreads"
final_report = run_deep_intelligence(user_handle)

print("\n" + "="*50)
print(f"🚀 REACHRADAR: {user_handle.upper()} FULL INTELLIGENCE REPORT")
print("="*50 + "\n")
print(final_report)