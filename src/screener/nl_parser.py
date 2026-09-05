import re
from typing import Dict, Any
from src.screener.engine import ScreenerFilter

class NaturalLanguageParser:
    """
    Natural Language Query Parser for Screener Filters.
    Parses conversational trading queries into structured quant filter parameters.
    """

    SECTOR_MAPPINGS = {
        "bank": "Financials",
        "banking": "Financials",
        "finansial": "Financials",
        "keuangan": "Financials",
        "energi": "Energy",
        "energy": "Energy",
        "tambang": "Energy",
        "batubara": "Energy",
        "telco": "Telecommunication",
        "telekomunikasi": "Telecommunication",
        "consumer": "Consumer Non-Cyclicals",
        "konsumer": "Consumer Non-Cyclicals",
        "rokok": "Consumer Non-Cyclicals",
        "makanan": "Consumer Non-Cyclicals",
        "otomotif": "Industrials",
        "industri": "Industrials",
        "properti": "Properties & Real Estate",
        "konstruksi": "Infrastructures",
        "kesehatan": "Healthcare",
        "farmasi": "Healthcare",
        "tech": "Technology",
        "teknologi": "Technology"
    }

    PATTERN_MAPPINGS = {
        "demand": "AREA_DEMAND",
        "area demand": "AREA_DEMAND",
        "support": "AREA_DEMAND",
        "pantulan": "AREA_DEMAND",
        "retest": "THROWBACK_RETEST",
        "throwback": "THROWBACK_RETEST",
        "pullback": "THROWBACK_RETEST",
        "sweep": "LIQUIDITY_SWEEP",
        "liquidity sweep": "LIQUIDITY_SWEEP",
        "spring": "LIQUIDITY_SWEEP",
        "stop hunt": "LIQUIDITY_SWEEP",
        "divergence": "BULL_DIVERGENCE",
        "divergensi": "BULL_DIVERGENCE",
        "bull div": "BULL_DIVERGENCE",
        "breakout": "EARLY_BREAKOUT",
        "early breakout": "EARLY_BREAKOUT",
        "squeeze": "EARLY_BREAKOUT",
        "ledakan volume": "EARLY_BREAKOUT"
    }

    def parse_query(self, query: str) -> ScreenerFilter:
        """Parse natural language query into a ScreenerFilter object."""
        q = query.lower()
        criteria: Dict[str, Any] = {
            "exclude_danger_zone": True,
            "sectors": [],
            "patterns": []
        }

        # 1. Check Sectors
        for keyword, sector_name in self.SECTOR_MAPPINGS.items():
            if re.search(r'\b' + re.escape(keyword) + r'\b', q):
                if sector_name not in criteria["sectors"]:
                    criteria["sectors"].append(sector_name)

        if not criteria["sectors"]:
            criteria["sectors"] = None

        # 2. Check Patterns
        for keyword, pattern_name in self.PATTERN_MAPPINGS.items():
            if re.search(r'\b' + re.escape(keyword) + r'\b', q):
                if pattern_name not in criteria["patterns"]:
                    criteria["patterns"].append(pattern_name)

        if not criteria["patterns"]:
            criteria["patterns"] = None

        # 3. Valuation & AI Score
        if "undervalue" in q or "murah" in q or "diskon" in q or "skor tinggi" in q or "kualitas" in q:
            criteria["min_ai_score"] = 70.0
        elif "fair" in q:
            criteria["min_ai_score"] = 55.0
            criteria["max_ai_score"] = 75.0

        # 4. Foreign Flow
        if "asing" in q or "foreign" in q or "net foreign" in q:
            if "jual" in q or "outflow" in q:
                criteria["net_foreign_positive"] = False
            else:
                criteria["net_foreign_positive"] = True

        # 5. Volume Intensity & Accumulation
        if "volume tinggi" in q or "spike" in q or "intensitas" in q or "ramai" in q:
            criteria["min_volume_intensity"] = 1.4

        if "akumulasi" in q or "hidden" in q or "bandar akum" in q or "serap" in q:
            criteria["require_hidden_accumulation"] = True

        if "orca" in q or "bandar besar" in q or "institusi" in q:
            criteria["require_orca_confluence"] = True

        # 6. Liquidity
        if "likuid" in q or "big cap" in q or "bluechip" in q or "lq45" in q:
            criteria["min_adtv"] = 5e9  # 5 Miliar IDR

        return ScreenerFilter(**criteria)
