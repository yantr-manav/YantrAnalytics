
# import os
# import json
# import subprocess
# from dotenv import load_dotenv
# from google import genai

# load_dotenv()
# client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# def get_full_channel_intelligence(handle_url):
#     print(f"📡 Deep-scanning {handle_url}...")
    
#     # -j: Output raw JSON for the entire channel
#     # --flat-playlist: Fast scan of the list
#     # --playlist-end 50: Get the last 50 items (Videos + Shorts)
#     cmd = [
#         'yt-dlp',
#         '--quiet',
#         '--no-warnings',
#         '-j',
#         '--flat-playlist',
#         '--playlist-end', '50', 
#         handle_url
#     ]
    
#     videos_data = []
#     channel_info = {"subs": "Unknown", "name": "Unknown"}

#     try:
#         # We use Popen because -j --flat-playlist outputs one JSON object per line
#         process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
#         for line in process.stdout:
#             item = json.loads(line)
            
#             # The first item or channel object usually contains subscriber info
#             if item.get('_type') == 'playlist' or 'channel' in item.get('webpage_url', ''):
#                 channel_info['subs'] = item.get('channel_follower_count') or item.get('uploader_id')
#                 channel_info['name'] = item.get('uploader')

#             # Extract video/short details
#             videos_data.append({
#                 "title": item.get("title"),
#                 "url": item.get("url") or f"https://www.youtube.com/watch?v={item.get('id')}",
#                 "views": item.get("view_count"),
#                 "likes": item.get("like_count"), # Note: May be None in flat-playlist
#                 "comments": item.get("comment_count"),
#                 "type": "Short" if item.get("duration") and item.get("duration") <= 60 else "Video"
#             })
            
#         process.wait()
#         return channel_info, videos_data
#     except Exception as e:
#         return None, f"Error: {str(e)}"

# def generate_strategic_report(channel_info, videos):
#     # Convert list of dicts to a clean string for Gemini
#     video_summary = "\n".join([
#         f"- [{v['type']}] {v['title']} | Views: {v['views']} | URL: {v['url']}" 
#         for v in videos[:30] # Limit to top 30 for the prompt context window
#     ])

#     prompt = f"""
#     Analyze this YouTube Channel Intel for a Social Media Analytics Project.
    
#     CHANNEL: {channel_info['name']}
#     SUBSCRIBERS: {channel_info['subs']}
#     RECENT CONTENT (Last 50 items):
#     {video_summary}
    
#     TASKS:
#     1. CONTENT MIX: What is the ratio of Shorts vs. Long-form? Which performs better?
#     2. VIRAL PATTERNS: Identify the common keywords in their most viewed videos.
#     3. AUDIENCE PERSONA: Based on these titles (e.g., {channel_info['name']}), who is watching?
#     4. COMPETITIVE EDGE: What specific style (educational, exam-focused, entertainment) is their 'moat'?
#     5. GROWTH ACTION PLAN: Give 3 specific post ideas that would trend in this niche.
#     """
    
#     response = client.models.generate_content(
#         model="gemini-2.5-flash",
#         contents=prompt
#     )
#     return response.text

# # --- RUN ---
# url = "https://www.youtube.com/@swayamdhadange-t5v/featured"
# info, data = get_full_channel_intelligence(url)

# if info and data:
#     print(f"✅ Found {len(data)} items for {info['name']} ({info['subs']} subscribers).")
#     report = generate_strategic_report(info, data)
#     print("\n📊 STRATEGIC ANALYSIS:\n", report)
# else:
#     print("❌ Critical Failure: Could not retrieve data.")
# 


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
user_handle = "@swayamdhadange-t5v"
final_report = run_deep_intelligence(user_handle)

print("\n" + "="*50)
print(f"🚀 REACHRADAR: {user_handle.upper()} FULL INTELLIGENCE REPORT")
print("="*50 + "\n")
print(final_report)