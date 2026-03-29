# -*- coding: utf-8 -*-
import streamlit as st
import os
import json
import logging
import subprocess
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from dotenv import load_dotenv
from google import genai
from pytrends.request import TrendReq
# --- SYSTEM OVERRIDES ---
# import sys
# # Ensures the terminal handling the output doesn't crash on emojis
# try:
#     sys.stdout.reconfigure(encoding='utf-8')
# except AttributeError:
#     pass
# --- CONFIGURATION & LOGGING ---
# import io
# import sys
# sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


load_dotenv()
st.set_page_config(page_title="ReachRadar Ultra", layout="wide", page_icon="💎")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
pytrends = TrendReq(hl='en-US', tz=360)

# --- STYLING ---
st.markdown("""
    <style>
    .main { background-color: #0e1117; }
    .stMetric { background-color: #161b22; padding: 15px; border-radius: 10px; border: 1px solid #30363d; }
    </style>
    """, unsafe_allow_html=True)

# --- CORE DATA ENGINES ---

def fetch_youtube_raw(url, limit=15):
    """Deep scans a specific tab (videos/shorts/community)."""
    cmd = ['yt-dlp', '--quiet', '--no-warnings', '-j', '--flat-playlist', '--playlist-end', str(limit), url]
    items = []
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)
        for line in process.stdout:
            item = json.loads(line)
            items.append({
                "title": item.get("title") or item.get("description", "No Title")[:50],
                "views": item.get("view_count", 0),
                "url": item.get("url") or f"https://www.youtube.com/watch?v={item.get('id')}",
                "date": item.get("upload_date"),
                "duration": item.get("duration", 0)
            })
        process.wait()
        return items
    except Exception as e:
        logger.error(f"Scrape Error: {e}")
        return []

def get_trends(keyword):
    """Fetches YouTube-specific search trends."""
    try:
        pytrends.build_payload([keyword], timeframe='now 7-d', gprop='youtube')
        rising = pytrends.related_queries().get(keyword, {}).get('rising')
        return rising.head(5) if rising is not None else pd.DataFrame()
    except:
        return pd.DataFrame()

def search_competitors(keyword, limit=3):
    cmd = ['yt-dlp', '--quiet', '--flat-playlist', '--print', '%(uploader)s||%(uploader_url)s', f"ytsearch{limit}: {keyword} channel"]
    res = subprocess.run(cmd, capture_output=True, text=True).stdout.strip().split('\n')
    return [line.split('||') for line in res if '||' in line]

# --- THE "INTELLIGENCE" HUB ---

def generate_report(user_data, comp_data, trends_data):
    """The Master Brain: Combines all signals into a strategic UI output."""
    prompt = f"""
    Act as a Senior Social Media Data Scientist.
    USER DATA: {json.dumps(user_data)}
    COMPETITOR DATA: {json.dumps(comp_data)}
    TRENDS: {trends_data}

    1. Extract the Primary Niche.
    2. Provide a 7-day action plan.
    3. Output a Mermaid.js diagram code for a 'Content Pillar Tree'.
    4. Provide a JSON block at the end with 'user_views' and 'comp_views' for charting.
    
    Output in clean Markdown.
    """
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return response.text

# --- UI LAYOUT ---

st.title("💎 ReachRadar: Creator War Room")
st.markdown("---")

handle = st.text_input("Enter YouTube Handle (e.g., @mrbeast):", placeholder="@swayamdhadange-t5v")

if st.button("Generate Full Intelligence Report"):
    if not handle:
        st.error("Please enter a handle!")
    else:
        with st.status("🚀 Launching Deep Scan...", expanded=True) as status:
            base_url = f"https://www.youtube.com/{handle}"
            
            st.write("📡 Harvesting Videos, Shorts, and Community Posts...")
            vids = fetch_youtube_raw(f"{base_url}/videos")
            shorts = fetch_track = fetch_youtube_raw(f"{base_url}/shorts")
            
            st.write("🎯 Identifying Niche & Competitors...")
            # Simple niche extraction to feed search
            niche_query = vids[0]['title'].split()[0] if vids else "Education"
            comps = search_competitors(niche_query)
            
            st.write("📈 Analyzing Search Intent Trends...")
            trends_df = get_trends(niche_query)
            
            st.write("🧠 Running AI Strategic Synthesis...")
            final_md = generate_report(vids, comps, trends_df.to_dict())
            
            status.update(label="✅ Analysis Complete!", state="complete")

        # --- DASHBOARD RENDERING ---
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Scan Volume", f"{len(vids) + len(shorts)} Items")
        with col2:
            st.metric("Primary Format", "Videos" if len(vids) > len(shorts) else "Shorts")
        with col3:
            avg_v = sum(d['views'] for d in vids)/len(vids) if vids else 0
            st.metric("Avg. Video Reach", f"{avg_v:,.0f}")

        st.markdown("### 📊 Engagement Deep-Dive")
        
        # Plotly: View Distribution
        df_vids = pd.DataFrame(vids)
        fig = px.area(df_vids, x=df_vids.index, y='views', title="View Velocity (Recent Videos)",
                      line_shape='spline', color_discrete_sequence=['#00f2ff'])
        st.plotly_chart(fig, use_container_width=True)

        tab1, tab2, tab3 = st.tabs(["🚀 Strategy Report", "🔍 Competitive Analysis", "📈 Market Trends"])

        with tab1:
            st.markdown(final_md)
            
        with tab2:
            st.write("### Competitor Benchmarking")
            c_cols = st.columns(len(comps))
            for i, comp in enumerate(comps):
                with c_cols[i]:
                    st.info(f"**{comp[0]}**")
                    st.caption(f"[Visit Channel]({comp[1]})")

        with tab3:
            if not trends_df.empty:
                st.write("### 🚀 Rising Search Topics (YouTube)")
                st.table(trends_df)
                fig_trends = px.bar(trends_df, x='query', y='value', title="Trend Intensity",
                                    color='value', color_continuous_scale='Viridis')
                st.plotly_chart(fig_trends, use_container_width=True)
            else:
                st.warning("No rising trends found for this niche in the last 7 days.")

        # --- MERMAID DIAGRAM ---
        st.markdown("### 🌲 Strategic Content Pillars")
        # In a real app, you'd parse the Mermaid code from the AI response. 
        # Here's a static high-level example for the UI:
        st.markdown("""
        ```mermaid
        graph TD
            A[User Content] --> B(Educational)
            A --> C(Engagement)
            B --> D[Exam Hacks]
            B --> E[Career Guidance]
            C --> F[Community Polls]
            C --> G[Motivational Shorts]
        ```
        """)

st.sidebar.title("Settings")
st.sidebar.info("This AI Intelligence Platform uses Multimodal Scrapers and Gemini 2.0 to provide prescriptive creator analytics.")