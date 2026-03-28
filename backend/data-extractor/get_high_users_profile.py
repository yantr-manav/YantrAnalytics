import os
import json
import subprocess
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def search_competitors(niche_keyword, limit=5):
    print(f"🔎 Searching for top creators in: {niche_keyword}...")
    # Using yt-dlp to search for 'channels' specifically in that niche
    search_query = f"ytsearch{limit}: {niche_keyword} channel"
    cmd = [
        'yt-dlp',
        '--quiet',
        '--no-warnings',
        '--flat-playlist',
        '--print', '%(uploader)s || %(uploader_url)s',
        search_query
    ]
    
    competitors = []
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        lines = result.stdout.strip().split('\n')
        for line in lines:
            if '||' in line:
                name, url = line.split(' || ')
                if url not in competitors:
                    competitors.append({"name": name, "url": url})
        return competitors
    except Exception as e:
        print(f"⚠️ Search error: {e}")
        return []

def get_profile_summary(url):
    """Quickly fetches the last 5 titles/views for a competitor"""
    cmd = ['yt-dlp', '--quiet', '--playlist-end', '5', '--print', '%(title)s (%(view_count)s views)', url]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()

def run_comparative_analysis(user_handle, user_report):
    # 1. Extract Niche using AI
    print("🎯 Identifying Niche...")
    niche_extract_prompt = f"Based on this report, output ONLY the 3-word keyword representing the niche: {user_report}"
    niche_resp = client.models.generate_content(model="gemini-2.5-flash", contents=niche_extract_prompt)
    niche = niche_resp.text.strip()

    # 2. Find Competitors
    competitors = search_competitors(niche)
    
    comp_data = ""
    for comp in competitors:
        summary = get_profile_summary(comp['url'])
        comp_data += f"\nCOMPETITOR: {comp['name']}\nURL: {comp['url']}\nRECENT CONTENT: {summary}\n"

    # 3. Final Deep Comparative Markdown
    final_prompt = f"""
    Act as a Master Content Strategist. 
    USER PROFILE DATA: {user_report}
    
    COMPETITOR MARKET DATA:
    {comp_data}
    
    GENERATE A HIGH-VALUE COMPARATIVE ANALYSIS MARKDOWN:
    
    # 🏆 Market Benchmarking: {user_handle} vs. The Top 5
    
    ## 📊 Comparative Metrics Table
    | Aspect | User Profile | Competitors (Top Tier) | The Gap |
    | :--- | :--- | :--- | :--- |
    | **Video Hook Style** | [Analyze User] | [Analyze Competitors] | [Specific Fix] |
    | **Content Depth** | [Analysis] | [Analysis] | [What's missing] |
    | **Visual Polish** | [Analysis] | [Analysis] | [Action] |
    | **Engagement Rate** | [Analysis] | [Analysis] | [Strategy] |

    ## 🔍 The 'Viral Secret' Analysis
    Analyze the highest viewed videos from competitors. 
    - What is their 'Editing Rhythm'?
    - What is their 'Thumbnail Psychology'?
    
    ## 💡 The 'Blue Ocean' Opportunity (The Gap)
    Identify a specific type of content or a 'Voice' that NONE of the 5 competitors are using, but the audience is craving. This is where the user can dominate.

    ## 🚀 7-Day 'Takeover' Action Plan
    Provide a day-by-day task list to improve the user's video generation quality and reach.
    """

    print("📊 Generating Comparative Master Report...")
    response = client.models.generate_content(model="gemini-2.5-flash", contents=final_prompt)
    return response.text

# --- EXECUTION ---
# (Assuming 'final_report' from the previous step is passed here)
comparative_markdown = run_comparative_analysis("@swayamdhadange-t5v", final_report)
print(comparative_markdown)