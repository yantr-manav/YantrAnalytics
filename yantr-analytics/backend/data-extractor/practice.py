import os
import json
import logging
import subprocess
import pandas as pd
from dotenv import load_dotenv
from google import genai
from pytrends.request import TrendReq
import sys
sys.stdout.reconfigure(encoding='utf-8')
# 1. Professional Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("reachradar.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
pytrends = TrendReq(hl='en-US', tz=360)

def get_google_trends(keyword):
    """Fetches real-time rising keywords related to the niche."""
    try:
        logger.info(f"📈 Fetching Google Trends for: {keyword}")
        pytrends.build_payload([keyword], cat=0, timeframe='now 7-d', geo='', gprop='youtube')
        related_queries = pytrends.related_queries()
        
        # Get 'rising' queries
        rising = related_queries.get(keyword, {}).get('rising')
        if rising is not None and not rising.empty:
            return rising.head(5).to_dict(orient='records')
        return "No significant rising trends in the last 7 days."
    except Exception as e:
        logger.error(f"Trends Error: {e}")
        return "Trends data unavailable (Rate limited or geo-restricted)."

def search_competitors(niche_keyword, limit=5):
    logger.info(f"🔎 Scouting high-value competitors in {niche_keyword}...")
    search_query = f"ytsearch{limit}: {niche_keyword} channel"
    cmd = [
        'yt-dlp', '--quiet', '--no-warnings', '--flat-playlist',
        '--print', '%(uploader)s || %(uploader_url)s',
        search_query
    ]
    
    competitors = []
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        for line in result.stdout.strip().split('\n'):
            if '||' in line:
                name, url = line.split(' || ')
                if url not in competitors: competitors.append({"name": name, "url": url})
        return competitors
    except Exception as e:
        logger.error(f"Competitor Search Error: {e}")
        return []

def get_content_deep_dive(url):
    """Fetches detailed metrics for the last 5 videos."""
    cmd = [
        'yt-dlp', '--quiet', '--playlist-end', '5', 
        '--print', '%(title)s || %(view_count)s || %(duration)s || %(upload_date)s', 
        url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout.strip()
    except Exception as e:
        return f"Metadata retrieval failed: {e}"

def run_ultra_analysis(user_handle, user_report_data):
    # --- PHASE 1: Niche & Trend Extraction ---
    logger.info("🎯 Stage 1: Identifying Niche & Future Trends...")
    niche_prompt = f"Based on this creator data, return ONLY a 2-word comma-separated niche keyword: {user_report_data}"
    niche_resp = client.models.generate_content(model="gemini-2.5-flash", contents=niche_prompt)
    niche_keyword = niche_resp.text.strip().split(',')[0] # Get the primary keyword
    
    trends = get_google_trends(niche_keyword)

    # --- PHASE 2: Competitive Intelligence ---
    competitors = search_competitors(niche_keyword)
    comp_packet = ""
    for comp in competitors:
        details = get_content_deep_dive(comp['url'])
        comp_packet += f"\nCREATOR: {comp['name']}\n{details}\n"

    # --- PHASE 3: The Master Intelligence Report ---
    logger.info("🧠 Stage 2: Running Multi-Persona Strategic Analysis...")
    final_prompt = f"""
    Act as a 'Retention Scientist' and 'Chief Growth Officer' for a major Creator Agency.
    
    USER DATA: {user_report_data}
    COMPETITOR MARKET DATA: {comp_packet}
    GOOGLE SEARCH TRENDS (RISING): {trends}
    
    GENERATE A HIGH-LEVEL MASTER REPORT IN MARKDOWN:

    # 💎 ReachRadar Ultra: Strategic Intelligence Report for {user_handle}

    ## 📈 1. Competitive Benchmarking & 'The Gap'
    Provide a detailed table comparing the User vs the Top 5 Competitors on:
    | Metric | User Status | Market Average | Competitive Advantage (How to win) |
    | :--- | :--- | :--- | :--- |
    | **Hook Velocity** | | | |
    | **Information Density** | | | |
    | **Thumbnail Psychology** | | | |
    | **Value-to-Length Ratio**| | | |

    ## 🕵️ 2. The 'Retention Science' Audit
    Analyze why the top competitors are getting more views. 
    - Is it the 'Editing Rhythm' (Pattern interrupts)? 
    - Is it 'Curiosity Gaps' in titles?
    - How does their 0-30s 'Hook' compare to the user?

    ## 🌊 3. The 'Blue Ocean' Opportunity
    Identify 2 content topics or 'Angles' that are RISING on Google Trends but NO competitors are currently covering well. This is the user's "First-Mover" advantage.

    ## 🚀 4. Viral Architecture (Pre-Production Blueprint)
    Give the user a 'Master Script Outline' for a 60-second Short and a 10-minute Video that uses all the viral hooks discovered in the competitors.

    ## 💰 5. Monetization & Brand Scalability
    Suggest 3 ways this creator can monetize their specific audience beyond AdSense (e.g., specific digital products, niche-consulting, or high-ticket affiliate programs).

    ## 🏁 6. 7-Day 'Elite' Action Plan
    Day-by-day tasks focusing on REPLACEMENT, not just more work. (e.g., "Day 2: Replace generic intro with a 2-second visual hook").
    """

    response = client.models.generate_content(model="gemini-2.5-flash", contents=final_prompt)
    return response.text

# --- EXECUTION ---
if __name__ == "__main__":
    handle = "@swayamdhadange-t5v"
    
    # In your real app, 'user_report_data' would be the output of your previous Aggregator script
    # For now, we simulate with a trigger
    mock_data = "User creates CMA exam guides, MCQ solving, and career advice for finance students."
    
    master_report = run_ultra_analysis(handle, mock_data)
    
    print("\n" + "="*60)
    print("🔥 REACHRADAR ULTRA: FINAL STRATEGIC OUTPUT")
    print("="*60 + "\n")
    print(master_report)