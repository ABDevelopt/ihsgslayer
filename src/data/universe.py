"""
Comprehensive IDX (Bursa Efek Indonesia) Universe Registry.
Expanded Catalog of 350+ Active IDX Stocks (.JK) Across All 11 Official Sectors.
"""

from typing import List, Dict, Any, Optional

FULL_IDX_UNIVERSE: List[Dict[str, Any]] = [
    # =========================================================================
    # 1. FINANCIALS (Perbankan Big Cap, Regional, Syariah, Digital, Sekuritas & Pembiayaan)
    # =========================================================================
    {"symbol": "BBCA.JK", "name": "Bank Central Asia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BBRI.JK", "name": "Bank Rakyat Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BMRI.JK", "name": "Bank Mandiri (Persero) Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BBNI.JK", "name": "Bank Negara Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BBTN.JK", "name": "Bank Tabungan Negara Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BDMN.JK", "name": "Bank Danamon Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BNGA.JK", "name": "Bank CIMB Niaga Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BRIS.JK", "name": "Bank Syariah Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": True},
    {"symbol": "BTPS.JK", "name": "Bank BTPN Syariah Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": True},
    {"symbol": "ARTO.JK", "name": "Bank Jago Tbk", "sector": "Financials", "subsector": "Digital Banks", "is_sharia": False},
    {"symbol": "MEGA.JK", "name": "Bank Mega Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BNII.JK", "name": "Bank Maybank Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "PNBN.JK", "name": "Bank Pan Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "PNIN.JK", "name": "Paninvest Tbk", "sector": "Financials", "subsector": "Investment & Holding", "is_sharia": False},
    {"symbol": "PNLF.JK", "name": "Panin Financial Tbk", "sector": "Financials", "subsector": "Insurance & Finance", "is_sharia": False},
    {"symbol": "NISP.JK", "name": "Bank OCBC NISP Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BJBR.JK", "name": "Bank BJB Tbk", "sector": "Financials", "subsector": "Regional Banks", "is_sharia": False},
    {"symbol": "BJTM.JK", "name": "Bank Jatim Tbk", "sector": "Financials", "subsector": "Regional Banks", "is_sharia": False},
    {"symbol": "BBKP.JK", "name": "Bank KB Bukopin Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BGTG.JK", "name": "Bank Ganesha Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BABP.JK", "name": "Bank MNC Internasional Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "NOBU.JK", "name": "Bank Nationalnobu Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BBYB.JK", "name": "Bank Neo Commerce Tbk", "sector": "Financials", "subsector": "Digital Banks", "is_sharia": False},
    {"symbol": "AGRO.JK", "name": "Bank Raya Indonesia Tbk", "sector": "Financials", "subsector": "Digital Banks", "is_sharia": False},
    {"symbol": "AMAR.JK", "name": "Bank Amar Indonesia Tbk", "sector": "Financials", "subsector": "Digital Banks", "is_sharia": False},
    {"symbol": "BCIC.JK", "name": "Bank JTrust Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BVIC.JK", "name": "Bank Victoria International Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "SDRA.JK", "name": "Bank Woori Saudara Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BNLI.JK", "name": "Bank Permata Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "PNBS.JK", "name": "Bank Panin Dubai Syariah Tbk", "sector": "Financials", "subsector": "Islamic Banks", "is_sharia": True},
    {"symbol": "BNBA.JK", "name": "Bank Bumi Arta Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "MCOR.JK", "name": "Bank China Construction Bank Indonesia Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "BEKS.JK", "name": "Bank Pembangunan Daerah Banten Tbk", "sector": "Financials", "subsector": "Regional Banks", "is_sharia": False},
    {"symbol": "ADMF.JK", "name": "Adira Dinamika Multi Finance Tbk", "sector": "Financials", "subsector": "Financing", "is_sharia": False},
    {"symbol": "BFIN.JK", "name": "BFI Finance Indonesia Tbk", "sector": "Financials", "subsector": "Financing", "is_sharia": False},
    {"symbol": "CFIN.JK", "name": "Clipan Finance Indonesia Tbk", "sector": "Financials", "subsector": "Financing", "is_sharia": False},
    {"symbol": "WOMF.JK", "name": "Wahana Ottomitra Multiartha Tbk", "sector": "Financials", "subsector": "Financing", "is_sharia": False},
    {"symbol": "TRIM.JK", "name": "Trimegah Sekuritas Indonesia Tbk", "sector": "Financials", "subsector": "Securities", "is_sharia": False},
    {"symbol": "PANS.JK", "name": "Panin Sekuritas Tbk", "sector": "Financials", "subsector": "Securities", "is_sharia": False},
    {"symbol": "YULE.JK", "name": "Yulie Sekuritas Indonesia Tbk", "sector": "Financials", "subsector": "Securities", "is_sharia": False},
    {"symbol": "AHAP.JK", "name": "Asuransi Harta Aman Pratama Tbk", "sector": "Financials", "subsector": "Insurance", "is_sharia": False},
    {"symbol": "ASDM.JK", "name": "Asuransi Dayin Mitra Tbk", "sector": "Financials", "subsector": "Insurance", "is_sharia": False},
    {"symbol": "LPGI.JK", "name": "Lippo General Insurance Tbk", "sector": "Financials", "subsector": "Insurance", "is_sharia": False},
    {"symbol": "TUGU.JK", "name": "Asuransi Tugu Pratama Indonesia Tbk", "sector": "Financials", "subsector": "Insurance", "is_sharia": True},

    # =========================================================================
    # 2. ENERGY (Batu Bara, Minyak, Gas, Logistik Energi, Jasa Pengeboran & Pelayaran Energi)
    # =========================================================================
    {"symbol": "ADRO.JK", "name": "Adaro Energy Indonesia Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "PTBA.JK", "name": "Bukit Asam Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "ITMG.JK", "name": "Indo Tambangraya Megah Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "PGAS.JK", "name": "Perusahaan Gas Negara Tbk", "sector": "Energy", "subsector": "Gas Utilities", "is_sharia": True},
    {"symbol": "MEDC.JK", "name": "Medco Energi Internasional Tbk", "sector": "Energy", "subsector": "Oil & Gas", "is_sharia": True},
    {"symbol": "AKRA.JK", "name": "AKR Corporindo Tbk", "sector": "Energy", "subsector": "Oil & Gas Logistics", "is_sharia": True},
    {"symbol": "INDY.JK", "name": "Indika Energy Tbk", "sector": "Energy", "subsector": "Coal & Diversified", "is_sharia": True},
    {"symbol": "BUMI.JK", "name": "Bumi Resources Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "HRUM.JK", "name": "Harum Energy Tbk", "sector": "Energy", "subsector": "Coal & Nickel", "is_sharia": True},
    {"symbol": "CUAN.JK", "name": "Petrindo Jaya Kreasi Tbk", "sector": "Energy", "subsector": "Coal & Minerals", "is_sharia": True},
    {"symbol": "DSSA.JK", "name": "Dian Swastatika Sentosa Tbk", "sector": "Energy", "subsector": "Energy & Coal", "is_sharia": True},
    {"symbol": "ENRG.JK", "name": "Energi Mega Persada Tbk", "sector": "Energy", "subsector": "Oil & Gas", "is_sharia": True},
    {"symbol": "ELSA.JK", "name": "Elnusa Tbk", "sector": "Energy", "subsector": "Oil Services", "is_sharia": True},
    {"symbol": "DOID.JK", "name": "Delta Dunia Makmur Tbk", "sector": "Energy", "subsector": "Mining Contracting", "is_sharia": True},
    {"symbol": "RAJA.JK", "name": "Rukun Raharja Tbk", "sector": "Energy", "subsector": "Gas Infrastructure", "is_sharia": True},
    {"symbol": "BIPI.JK", "name": "Astrindo Nusantara Infrastruktur Tbk", "sector": "Energy", "subsector": "Energy Logistics", "is_sharia": True},
    {"symbol": "KKGI.JK", "name": "Resource Alam Indonesia Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "ABMM.JK", "name": "ABM Investama Tbk", "sector": "Energy", "subsector": "Coal Services", "is_sharia": True},
    {"symbol": "MBAP.JK", "name": "Mitrabara Adiperdana Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "TOBA.JK", "name": "TBS Energi Utama Tbk", "sector": "Energy", "subsector": "Energy", "is_sharia": True},
    {"symbol": "BSSR.JK", "name": "Baramulti Suksessarana Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "SGER.JK", "name": "Sumber Global Energy Tbk", "sector": "Energy", "subsector": "Coal Trading", "is_sharia": True},
    {"symbol": "TEBE.JK", "name": "Dana Brata Luhur Tbk", "sector": "Energy", "subsector": "Coal Infrastructure", "is_sharia": True},
    {"symbol": "LEAD.JK", "name": "Logindo Samudramakmur Tbk", "sector": "Energy", "subsector": "Offshore Oil Support", "is_sharia": True},
    {"symbol": "BULL.JK", "name": "Buana Lintas Lautan Tbk", "sector": "Energy", "subsector": "Oil Tanker Shipping", "is_sharia": True},
    {"symbol": "PSSI.JK", "name": "Pelita Samudera Shipping Tbk", "sector": "Energy", "subsector": "Coal Logistics", "is_sharia": True},
    {"symbol": "WINS.JK", "name": "Wintermar Offshore Marine Tbk", "sector": "Energy", "subsector": "Offshore Support", "is_sharia": True},
    {"symbol": "SMMT.JK", "name": "Golden Eagle Energy Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "APEX.JK", "name": "Apexindo Pratama Duta Tbk", "sector": "Energy", "subsector": "Drilling Services", "is_sharia": True},
    {"symbol": "FIRE.JK", "name": "Alfa Energi Investama Tbk", "sector": "Energy", "subsector": "Coal Trading", "is_sharia": True},
    {"symbol": "GTBO.JK", "name": "Garda Tujuh Buana Tbk", "sector": "Energy", "subsector": "Coal", "is_sharia": True},
    {"symbol": "PKPK.JK", "name": "Perdana Karya Perkasa Tbk", "sector": "Energy", "subsector": "Energy Services", "is_sharia": True},
    {"symbol": "DEWA.JK", "name": "Darma Henwa Tbk", "sector": "Energy", "subsector": "Mining Services", "is_sharia": True},

    # =========================================================================
    # 3. BASIC MATERIALS (Nikel, Emas, Tembaga, Petrokimia, Semen, Kertas, Baja)
    # =========================================================================
    {"symbol": "BRPT.JK", "name": "Barito Pacific Tbk", "sector": "Basic Materials", "subsector": "Petrochemicals", "is_sharia": True},
    {"symbol": "TPIA.JK", "name": "Chandra Asri Pacific Tbk", "sector": "Basic Materials", "subsector": "Petrochemicals", "is_sharia": True},
    {"symbol": "MDKA.JK", "name": "Merdeka Copper Gold Tbk", "sector": "Basic Materials", "subsector": "Gold & Copper", "is_sharia": True},
    {"symbol": "AMMN.JK", "name": "Amman Mineral Internasional Tbk", "sector": "Basic Materials", "subsector": "Copper & Gold", "is_sharia": True},
    {"symbol": "ANTM.JK", "name": "Aneka Tambang Tbk", "sector": "Basic Materials", "subsector": "Gold & Nickel", "is_sharia": True},
    {"symbol": "INCO.JK", "name": "Vale Indonesia Tbk", "sector": "Basic Materials", "subsector": "Nickel", "is_sharia": True},
    {"symbol": "NCKL.JK", "name": "Trimegah Bangun Persada Tbk", "sector": "Basic Materials", "subsector": "Nickel", "is_sharia": True},
    {"symbol": "MBMA.JK", "name": "Merdeka Battery Materials Tbk", "sector": "Basic Materials", "subsector": "Battery Materials", "is_sharia": True},
    {"symbol": "TINS.JK", "name": "Timah Tbk", "sector": "Basic Materials", "subsector": "Tin", "is_sharia": True},
    {"symbol": "SMGR.JK", "name": "Semen Indonesia (Persero) Tbk", "sector": "Basic Materials", "subsector": "Cement", "is_sharia": True},
    {"symbol": "INTP.JK", "name": "Indocement Tunggal Prakarsa Tbk", "sector": "Basic Materials", "subsector": "Cement", "is_sharia": True},
    {"symbol": "SMBR.JK", "name": "Semen Baturaja (Persero) Tbk", "sector": "Basic Materials", "subsector": "Cement", "is_sharia": True},
    {"symbol": "INKP.JK", "name": "Indah Kiat Pulp & Paper Tbk", "sector": "Basic Materials", "subsector": "Paper & Pulp", "is_sharia": True},
    {"symbol": "TKIM.JK", "name": "Pabrik Kertas Tjiwi Kimia Tbk", "sector": "Basic Materials", "subsector": "Paper & Pulp", "is_sharia": True},
    {"symbol": "AVIA.JK", "name": "Avia Avian Tbk", "sector": "Basic Materials", "subsector": "Paints & Chemicals", "is_sharia": True},
    {"symbol": "ESSA.JK", "name": "ESSA Industries Indonesia Tbk", "sector": "Basic Materials", "subsector": "Ammonia & LPG", "is_sharia": True},
    {"symbol": "KRAS.JK", "name": "Krakatau Steel (Persero) Tbk", "sector": "Basic Materials", "subsector": "Steel", "is_sharia": True},
    {"symbol": "NICL.JK", "name": "PAM Mineral Tbk", "sector": "Basic Materials", "subsector": "Nickel", "is_sharia": True},
    {"symbol": "ARCI.JK", "name": "Archi Indonesia Tbk", "sector": "Basic Materials", "subsector": "Gold", "is_sharia": True},
    {"symbol": "PSAB.JK", "name": "J Resources Asia Pasifik Tbk", "sector": "Basic Materials", "subsector": "Gold", "is_sharia": True},
    {"symbol": "BRMS.JK", "name": "Bumi Resources Minerals Tbk", "sector": "Basic Materials", "subsector": "Gold & Minerals", "is_sharia": True},
    {"symbol": "AGII.JK", "name": "Samator Indo Gas Tbk", "sector": "Basic Materials", "subsector": "Industrial Gas", "is_sharia": True},
    {"symbol": "CITA.JK", "name": "Cita Mineral Investindo Tbk", "sector": "Basic Materials", "subsector": "Bauxite & Alumina", "is_sharia": True},
    {"symbol": "IFSH.JK", "name": "Ifishdeco Tbk", "sector": "Basic Materials", "subsector": "Nickel", "is_sharia": True},
    {"symbol": "DKFT.JK", "name": "Central Omega Resources Tbk", "sector": "Basic Materials", "subsector": "Nickel", "is_sharia": True},
    {"symbol": "ZINC.JK", "name": "Kapuas Prima Coal Tbk", "sector": "Basic Materials", "subsector": "Zinc & Lead", "is_sharia": True},
    {"symbol": "NIKL.JK", "name": "Pelat Timah Nusantara Tbk", "sector": "Basic Materials", "subsector": "Tin Plate", "is_sharia": True},
    {"symbol": "GDST.JK", "name": "Gunawan Dianjaya Steel Tbk", "sector": "Basic Materials", "subsector": "Steel Plate", "is_sharia": True},
    {"symbol": "ALKA.JK", "name": "Alakasa Industrindo Tbk", "sector": "Basic Materials", "subsector": "Aluminum", "is_sharia": True},
    {"symbol": "ALMI.JK", "name": "Alumindo Light Metal Industry Tbk", "sector": "Basic Materials", "subsector": "Aluminum", "is_sharia": True},
    {"symbol": "INCF.JK", "name": "Indo Komoditi Korpora Tbk", "sector": "Basic Materials", "subsector": "Rubber & Chemicals", "is_sharia": True},
    {"symbol": "BMSR.JK", "name": "Bintang Mitra Semestaraya Tbk", "sector": "Basic Materials", "subsector": "Chemicals", "is_sharia": True},
    {"symbol": "SMGA.JK", "name": "Sumber Mineral Global Abadi Tbk", "sector": "Basic Materials", "subsector": "Nickel & Minerals", "is_sharia": True},

    # =========================================================================
    # 4. CONSUMER NON-CYCLICALS (Makanan, Minuman, Rokok, Sawit / CPO, Farmasi)
    # =========================================================================
    {"symbol": "ICBP.JK", "name": "Indofood CBP Sukses Makmur Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Food & Beverage", "is_sharia": True},
    {"symbol": "INDF.JK", "name": "Indofood Sukses Makmur Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Food & Beverage", "is_sharia": True},
    {"symbol": "UNVR.JK", "name": "Unilever Indonesia Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Household Products", "is_sharia": True},
    {"symbol": "MYOR.JK", "name": "Mayora Indah Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Food & Confectionery", "is_sharia": True},
    {"symbol": "CPIN.JK", "name": "Charoen Pokphand Indonesia Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Poultry", "is_sharia": True},
    {"symbol": "JPFA.JK", "name": "JAPFA Comfeed Indonesia Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Poultry", "is_sharia": True},
    {"symbol": "MAIN.JK", "name": "Malindo Feedmill Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Poultry", "is_sharia": True},
    {"symbol": "SIPD.JK", "name": "Sreeya Sewu Indonesia Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Poultry & Food", "is_sharia": True},
    {"symbol": "CMRY.JK", "name": "Cisarua Mountain Dairy Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Dairy", "is_sharia": True},
    {"symbol": "HMSP.JK", "name": "HM Sampoerna Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Tobacco", "is_sharia": False},
    {"symbol": "GGRM.JK", "name": "Gudang Garam Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Tobacco", "is_sharia": False},
    {"symbol": "WIIM.JK", "name": "Wismilak Inti Makmur Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Tobacco", "is_sharia": False},
    {"symbol": "SIDO.JK", "name": "Industri Jamu Dan Farmasi Sido Muncul Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Herbal Pharma", "is_sharia": True},
    {"symbol": "ULTJ.JK", "name": "Ultra Jaya Milk Industry Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Dairy & Beverage", "is_sharia": True},
    {"symbol": "ROTI.JK", "name": "Nippon Indosari Corpindo Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Bakery", "is_sharia": True},
    {"symbol": "CLEO.JK", "name": "Sariguna Primatirta Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Bottled Water", "is_sharia": True},
    {"symbol": "ADES.JK", "name": "Akasha Wira International Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Bottled Water & Cosmetics", "is_sharia": True},
    {"symbol": "STTP.JK", "name": "Siantar Top Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Snacks", "is_sharia": True},
    {"symbol": "CAMP.JK", "name": "Campina Ice Cream Industry Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Ice Cream", "is_sharia": True},
    {"symbol": "GOOD.JK", "name": "Garudafood Putra Putri Jaya Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Snacks & Drinks", "is_sharia": True},
    {"symbol": "HOKI.JK", "name": "Buyung Poetra Sembada Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Rice Processing", "is_sharia": True},
    {"symbol": "AALI.JK", "name": "Astra Agro Lestari Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "LSIP.JK", "name": "PP London Sumatra Indonesia Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "TAPG.JK", "name": "Triputra Agro Persada Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "DSNG.JK", "name": "Dharma Satya Nusantara Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "SSMS.JK", "name": "Sawit Sumbermas Sarana Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "SIMP.JK", "name": "Salim Ivomas Pratama Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "TBLA.JK", "name": "Tunas Baru Lampung Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "CPO & Sugar", "is_sharia": True},
    {"symbol": "STAA.JK", "name": "Sumber Tani Agung Resources Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "BWPT.JK", "name": "Eagle High Plantations Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "PALM.JK", "name": "Provident Investasi Bersama Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Agribusiness", "is_sharia": True},
    {"symbol": "FAPA.JK", "name": "FAP Agri Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "UNSP.JK", "name": "Bakrie Sumatra Plantations Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "GZCO.JK", "name": "Gozco Plantations Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantations / CPO", "is_sharia": True},
    {"symbol": "DLTA.JK", "name": "Delta Djakarta Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Beverages", "is_sharia": False},
    {"symbol": "MLBI.JK", "name": "Multi Bintang Indonesia Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Beverages", "is_sharia": False},

    # =========================================================================
    # 5. CONSUMER CYCLICALS (Ritel, Otomotif, Media, Restoran, Furnitur, Hotel)
    # =========================================================================
    {"symbol": "ACES.JK", "name": "Aspirasi Hidup Indonesia Tbk (ACE)", "sector": "Consumer Cyclicals", "subsector": "Home Improvement", "is_sharia": True},
    {"symbol": "MAPI.JK", "name": "Mitra Adiperkasa Tbk", "sector": "Consumer Cyclicals", "subsector": "Specialty Retail", "is_sharia": True},
    {"symbol": "MAPA.JK", "name": "MAP Aktif Adiperkasa Tbk", "sector": "Consumer Cyclicals", "subsector": "Sports Retail", "is_sharia": True},
    {"symbol": "MAPB.JK", "name": "MAP Boga Adiperkasa Tbk", "sector": "Consumer Cyclicals", "subsector": "Food Retail / Starbucks", "is_sharia": True},
    {"symbol": "ERAA.JK", "name": "Erajaya Swasembada Tbk", "sector": "Consumer Cyclicals", "subsector": "Electronics Retail", "is_sharia": True},
    {"symbol": "ASII.JK", "name": "Astra International Tbk", "sector": "Consumer Cyclicals", "subsector": "Automotive & Conglomerate", "is_sharia": True},
    {"symbol": "AUTO.JK", "name": "Astra Otoparts Tbk", "sector": "Consumer Cyclicals", "subsector": "Auto Components", "is_sharia": True},
    {"symbol": "DRMA.JK", "name": "Dharma Polimetal Tbk", "sector": "Consumer Cyclicals", "subsector": "Auto Components", "is_sharia": True},
    {"symbol": "SMSM.JK", "name": "Selamat Sempurna Tbk", "sector": "Consumer Cyclicals", "subsector": "Auto Filters", "is_sharia": True},
    {"symbol": "GJTL.JK", "name": "Gajah Tunggal Tbk", "sector": "Consumer Cyclicals", "subsector": "Tires", "is_sharia": True},
    {"symbol": "RALS.JK", "name": "Ramayana Lestari Sentosa Tbk", "sector": "Consumer Cyclicals", "subsector": "Department Stores", "is_sharia": True},
    {"symbol": "LPPF.JK", "name": "Matahari Department Store Tbk", "sector": "Consumer Cyclicals", "subsector": "Department Stores", "is_sharia": True},
    {"symbol": "MNCN.JK", "name": "Media Nusantara Citra Tbk", "sector": "Consumer Cyclicals", "subsector": "Media & TV", "is_sharia": True},
    {"symbol": "SCMA.JK", "name": "Surya Citra Media Tbk", "sector": "Consumer Cyclicals", "subsector": "Media & TV", "is_sharia": True},
    {"symbol": "PZZA.JK", "name": "Sarimelati Kencana Tbk (Pizza Hut)", "sector": "Consumer Cyclicals", "subsector": "Restaurants", "is_sharia": True},
    {"symbol": "FAST.JK", "name": "Fast Food Indonesia Tbk (KFC)", "sector": "Consumer Cyclicals", "subsector": "Restaurants", "is_sharia": True},
    {"symbol": "WOOD.JK", "name": "Integra Indocabinet Tbk", "sector": "Consumer Cyclicals", "subsector": "Furniture", "is_sharia": True},
    {"symbol": "CSAP.JK", "name": "Catur Sentosa Adiprana Tbk (Mitra10)", "sector": "Consumer Cyclicals", "subsector": "Building Materials Retail", "is_sharia": True},
    {"symbol": "BOLT.JK", "name": "Garuda Metalindo Tbk", "sector": "Consumer Cyclicals", "subsector": "Fasteners & Auto Parts", "is_sharia": True},
    {"symbol": "IMAS.JK", "name": "Indomobil Sukses Internasional Tbk", "sector": "Consumer Cyclicals", "subsector": "Automotive Distribution", "is_sharia": True},
    {"symbol": "HERO.JK", "name": "Hero Supermarket Tbk", "sector": "Consumer Cyclicals", "subsector": "Retail / IKEA", "is_sharia": True},
    {"symbol": "MPPA.JK", "name": "Matahari Putra Prima Tbk (Hypermart)", "sector": "Consumer Cyclicals", "subsector": "Supermarkets", "is_sharia": True},
    {"symbol": "PANR.JK", "name": "Panorama Sentrawisata Tbk", "sector": "Consumer Cyclicals", "subsector": "Travel & Tourism", "is_sharia": True},
    {"symbol": "SHID.JK", "name": "Hotel Sahid Jaya International Tbk", "sector": "Consumer Cyclicals", "subsector": "Hotels", "is_sharia": True},
    {"symbol": "DFAM.JK", "name": "Dafam Property Indonesia Tbk", "sector": "Consumer Cyclicals", "subsector": "Hotels", "is_sharia": True},

    # =========================================================================
    # 6. INFRASTRUCTURES & TELECOMMUNICATION (Telco, Menara, Energi Bersih, Jalan Tol & Konstruksi)
    # =========================================================================
    {"symbol": "TLKM.JK", "name": "Telkom Indonesia Tbk", "sector": "Telecommunication", "subsector": "Telecom Services", "is_sharia": True},
    {"symbol": "ISAT.JK", "name": "Indosat Ooredoo Hutchison Tbk", "sector": "Telecommunication", "subsector": "Telecom Services", "is_sharia": True},
    {"symbol": "EXCL.JK", "name": "XL Axiata Tbk", "sector": "Telecommunication", "subsector": "Telecom Services", "is_sharia": True},
    {"symbol": "TOWR.JK", "name": "Sarana Menara Nusantara Tbk", "sector": "Infrastructures", "subsector": "Telecom Towers", "is_sharia": True},
    {"symbol": "TBIG.JK", "name": "Tower Bersama Infrastructure Tbk", "sector": "Infrastructures", "subsector": "Telecom Towers", "is_sharia": True},
    {"symbol": "MTEL.JK", "name": "Dayamitra Telekomunikasi Tbk (Mitratel)", "sector": "Infrastructures", "subsector": "Telecom Towers", "is_sharia": True},
    {"symbol": "CENT.JK", "name": "Centratama Telekomunikasi Indonesia Tbk", "sector": "Infrastructures", "subsector": "Telecom Towers", "is_sharia": True},
    {"symbol": "BREN.JK", "name": "Barito Renewables Energy Tbk", "sector": "Infrastructures", "subsector": "Geothermal Energy", "is_sharia": True},
    {"symbol": "PGEO.JK", "name": "Pertamina Geothermal Energy Tbk", "sector": "Infrastructures", "subsector": "Geothermal Energy", "is_sharia": True},
    {"symbol": "JSMR.JK", "name": "Jasa Marga (Persero) Tbk", "sector": "Infrastructures", "subsector": "Toll Roads", "is_sharia": True},
    {"symbol": "CMNP.JK", "name": "Citra Marga Nusaphala Persada Tbk", "sector": "Infrastructures", "subsector": "Toll Roads", "is_sharia": True},
    {"symbol": "POWR.JK", "name": "Cikarang Listrindo Tbk", "sector": "Infrastructures", "subsector": "Power Generation", "is_sharia": True},
    {"symbol": "KEEN.JK", "name": "Kencana Energi Lestari Tbk", "sector": "Infrastructures", "subsector": "Hydro Energy", "is_sharia": True},
    {"symbol": "ARKO.JK", "name": "Arkora Hydro Tbk", "sector": "Infrastructures", "subsector": "Hydro Energy", "is_sharia": True},
    {"symbol": "WIKA.JK", "name": "Wijaya Karya (Persero) Tbk", "sector": "Infrastructures", "subsector": "Civil Construction", "is_sharia": True},
    {"symbol": "PTPP.JK", "name": "PP (Persero) Tbk", "sector": "Infrastructures", "subsector": "Civil Construction", "is_sharia": True},
    {"symbol": "ADHI.JK", "name": "Adhi Karya (Persero) Tbk", "sector": "Infrastructures", "subsector": "Civil Construction", "is_sharia": True},
    {"symbol": "TOTL.JK", "name": "Total Bangun Persada Tbk", "sector": "Infrastructures", "subsector": "Building Construction", "is_sharia": True},
    {"symbol": "WEGE.JK", "name": "Wijaya Karya Bangunan Gedung Tbk", "sector": "Infrastructures", "subsector": "Building Construction", "is_sharia": True},
    {"symbol": "NRCA.JK", "name": "Nusa Raya Cipta Tbk", "sector": "Infrastructures", "subsector": "Construction", "is_sharia": True},
    {"symbol": "ACST.JK", "name": "Acset Indonusa Tbk", "sector": "Infrastructures", "subsector": "Foundation & Construction", "is_sharia": True},
    {"symbol": "IPCC.JK", "name": "Indonesia Kendaraan Terminal Tbk", "sector": "Infrastructures", "subsector": "Port Services", "is_sharia": True},
    {"symbol": "IPCM.JK", "name": "Jasa Armada Indonesia Tbk", "sector": "Infrastructures", "subsector": "Port Marine Services", "is_sharia": True},

    # =========================================================================
    # 7. PROPERTIES & REAL ESTATE (Kota Mandiri, Kawasan Industri, Mall & Residensial)
    # =========================================================================
    {"symbol": "BSDE.JK", "name": "Bumi Serpong Damai Tbk", "sector": "Properties", "subsector": "Township Development", "is_sharia": True},
    {"symbol": "CTRA.JK", "name": "Ciputra Development Tbk", "sector": "Properties", "subsector": "Residential & Commercial", "is_sharia": True},
    {"symbol": "PWON.JK", "name": "Pakuwon Jati Tbk", "sector": "Properties", "subsector": "Malls & Mixed Use", "is_sharia": True},
    {"symbol": "SMRA.JK", "name": "Summarecon Agung Tbk", "sector": "Properties", "subsector": "Township Development", "is_sharia": True},
    {"symbol": "PANI.JK", "name": "Pantai Indah Kapuk Dua Tbk", "sector": "Properties", "subsector": "Megaproject Real Estate", "is_sharia": True},
    {"symbol": "ASRI.JK", "name": "Alam Sutera Realty Tbk", "sector": "Properties", "subsector": "Township Development", "is_sharia": True},
    {"symbol": "DILD.JK", "name": "Intiland Development Tbk", "sector": "Properties", "subsector": "Residential & Office", "is_sharia": True},
    {"symbol": "KIJA.JK", "name": "Kawasan Industri Jababeka Tbk", "sector": "Properties", "subsector": "Industrial Estates", "is_sharia": True},
    {"symbol": "SSIA.JK", "name": "Surya Semesta Internusa Tbk", "sector": "Properties", "subsector": "Industrial & Construction", "is_sharia": True},
    {"symbol": "DMAS.JK", "name": "Puradelta Lestari Tbk", "sector": "Properties", "subsector": "Industrial & Township", "is_sharia": True},
    {"symbol": "BEST.JK", "name": "Bekasi Fajar Industrial Estate Tbk", "sector": "Properties", "subsector": "Industrial Estates", "is_sharia": True},
    {"symbol": "BKSL.JK", "name": "Sentul City Tbk", "sector": "Properties", "subsector": "Township Development", "is_sharia": True},
    {"symbol": "APLN.JK", "name": "Agung Podomoro Land Tbk", "sector": "Properties", "subsector": "Commercial & Residential", "is_sharia": True},
    {"symbol": "LPKR.JK", "name": "Lippo Karawaci Tbk", "sector": "Properties", "subsector": "Real Estate & Healthcare", "is_sharia": True},
    {"symbol": "LPCK.JK", "name": "Lippo Cikarang Tbk", "sector": "Properties", "subsector": "Industrial & Residential", "is_sharia": True},
    {"symbol": "JRPT.JK", "name": "Jaya Real Property Tbk (Bintaro Jaya)", "sector": "Properties", "subsector": "Township Development", "is_sharia": True},
    {"symbol": "MTLA.JK", "name": "Metropolitan Land Tbk", "sector": "Properties", "subsector": "Residential & Hotels", "is_sharia": True},
    {"symbol": "GPRA.JK", "name": "Perdana Gapuraprima Tbk", "sector": "Properties", "subsector": "Residential", "is_sharia": True},
    {"symbol": "TRIN.JK", "name": "Perintis Triniti Properti Tbk", "sector": "Properties", "subsector": "Mixed-Use Properties", "is_sharia": True},
    {"symbol": "RISE.JK", "name": "Jaya Sukses Makmur Sentosa Tbk (Tanrise)", "sector": "Properties", "subsector": "Commercial & Residential", "is_sharia": True},
    {"symbol": "SMDM.JK", "name": "Suryamas Dutamakmur Tbk (Rancamaya)", "sector": "Properties", "subsector": "Township & Golf", "is_sharia": True},
    {"symbol": "PUDP.JK", "name": "Pudjiadi Prestige Tbk", "sector": "Properties", "subsector": "Residential", "is_sharia": True},
    {"symbol": "BAPA.JK", "name": "Bekasi Asri Pemula Tbk", "sector": "Properties", "subsector": "Residential", "is_sharia": True},

    # =========================================================================
    # 8. TECHNOLOGY (Platform Digital, IT Services, Data Center, Software)
    # =========================================================================
    {"symbol": "GOTO.JK", "name": "GoTo Gojek Tokopedia Tbk", "sector": "Technology", "subsector": "On-Demand & E-Commerce", "is_sharia": True},
    {"symbol": "BUKA.JK", "name": "Bukalapak.com Tbk", "sector": "Technology", "subsector": "E-Commerce & Gaming", "is_sharia": True},
    {"symbol": "BELI.JK", "name": "Global Digital Niaga Tbk (Blibli)", "sector": "Technology", "subsector": "E-Commerce & Omnichannel", "is_sharia": True},
    {"symbol": "EMTK.JK", "name": "Elang Mahkota Teknologi Tbk", "sector": "Technology", "subsector": "Tech Conglomerate", "is_sharia": True},
    {"symbol": "DCII.JK", "name": "DCI Indonesia Tbk", "sector": "Technology", "subsector": "Data Centers", "is_sharia": True},
    {"symbol": "EDGE.JK", "name": "Indointernet Tbk", "sector": "Technology", "subsector": "Data Centers & Cloud", "is_sharia": True},
    {"symbol": "MTDL.JK", "name": "Metrodata Electronics Tbk", "sector": "Technology", "subsector": "IT Distribution & Solutions", "is_sharia": True},
    {"symbol": "WIRG.JK", "name": "WIR Asia Tbk", "sector": "Technology", "subsector": "AR & Metaverse Tech", "is_sharia": True},
    {"symbol": "MCAS.JK", "name": "M Cash Integrasi Tbk", "sector": "Technology", "subsector": "Digital Distribution", "is_sharia": True},
    {"symbol": "DMMX.JK", "name": "Digital Mediatama Maxima Tbk", "sector": "Technology", "subsector": "Digital Trade", "is_sharia": True},
    {"symbol": "KIOS.JK", "name": "Kioson Komersial Indonesia Tbk", "sector": "Technology", "subsector": "E-Commerce Solutions", "is_sharia": True},
    {"symbol": "DIVA.JK", "name": "Distribusi Voucher Nusantara Tbk", "sector": "Technology", "subsector": "Digital Infrastructure", "is_sharia": True},
    {"symbol": "GLVA.JK", "name": "Galva Technologies Tbk", "sector": "Technology", "subsector": "IT Solutions", "is_sharia": True},
    {"symbol": "WIFI.JK", "name": "Solusi Sinergi Digital Tbk (Surge)", "sector": "Technology", "subsector": "Digital Connectivity", "is_sharia": True},
    {"symbol": "UVCR.JK", "name": "Trimegah Karya Pratama Tbk (Ultra Voucher)", "sector": "Technology", "subsector": "Digital Voucher", "is_sharia": True},
    {"symbol": "HDIT.JK", "name": "Hensel Davest Indonesia Tbk", "sector": "Technology", "subsector": "Fintech Solutions", "is_sharia": True},
    {"symbol": "IRSX.JK", "name": "Aviana Sinar Abadi Tbk", "sector": "Technology", "subsector": "Software & AI Tech", "is_sharia": True},

    # =========================================================================
    # 9. HEALTHCARE (Rumah Sakit, Farmasi, Diagnostik Medis, Alat Kesehatan)
    # =========================================================================
    {"symbol": "KLBF.JK", "name": "Kalbe Farma Tbk", "sector": "Healthcare", "subsector": "Pharmaceuticals", "is_sharia": True},
    {"symbol": "MIKA.JK", "name": "Mitra Keluarga Karyasehat Tbk", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},
    {"symbol": "SILO.JK", "name": "Siloam International Hospitals Tbk", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},
    {"symbol": "HEAL.JK", "name": "Medikaloka Hermina Tbk", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},
    {"symbol": "PRDA.JK", "name": "Prodia Widyahusada Tbk", "sector": "Healthcare", "subsector": "Clinical Laboratories", "is_sharia": True},
    {"symbol": "SAME.JK", "name": "Sarana Meditama Metropolitan Tbk", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},
    {"symbol": "TSPC.JK", "name": "Tempo Scan Pacific Tbk", "sector": "Healthcare", "subsector": "Pharma & Consumer Health", "is_sharia": True},
    {"symbol": "KAEF.JK", "name": "Kimia Farma Tbk", "sector": "Healthcare", "subsector": "Pharma & Retail", "is_sharia": True},
    {"symbol": "INAF.JK", "name": "Indofarma Tbk", "sector": "Healthcare", "subsector": "Pharma", "is_sharia": True},
    {"symbol": "SRAJ.JK", "name": "Sejahteraraya Anugrahjaya Tbk (Mayapada)", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},
    {"symbol": "CARE.JK", "name": "Metro Healthcare Indonesia Tbk", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},
    {"symbol": "BMHS.JK", "name": "Bundamedik Tbk (RS Bunda)", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},
    {"symbol": "OMED.JK", "name": "Jayamas Medica Industri Tbk", "sector": "Healthcare", "subsector": "Medical Devices", "is_sharia": True},
    {"symbol": "PEHA.JK", "name": "Phapros Tbk", "sector": "Healthcare", "subsector": "Pharma", "is_sharia": True},
    {"symbol": "PYFA.JK", "name": "Pyridam Farma Tbk", "sector": "Healthcare", "subsector": "Pharma", "is_sharia": True},
    {"symbol": "MERK.JK", "name": "Merck Tbk", "sector": "Healthcare", "subsector": "Pharma", "is_sharia": True},
    {"symbol": "DVLA.JK", "name": "Darya-Varia Laboratoria Tbk", "sector": "Healthcare", "subsector": "Pharma", "is_sharia": True},
    {"symbol": "SOHO.JK", "name": "Soho Global Health Tbk", "sector": "Healthcare", "subsector": "Pharma & Supplements", "is_sharia": True},
    {"symbol": "RSGK.JK", "name": "Kedoya Adyaraya Tbk", "sector": "Healthcare", "subsector": "Hospitals", "is_sharia": True},

    # =========================================================================
    # 10. INDUSTRIALS & HEAVY EQUIPMENT
    # =========================================================================
    {"symbol": "UNTR.JK", "name": "United Tractors Tbk", "sector": "Industrials", "subsector": "Heavy Equipment & Mining", "is_sharia": True},
    {"symbol": "HEXA.JK", "name": "Hexindo Adiperkasa Tbk", "sector": "Industrials", "subsector": "Heavy Equipment", "is_sharia": True},
    {"symbol": "KBLI.JK", "name": "KMI Wire and Cable Tbk", "sector": "Industrials", "subsector": "Electrical Cables", "is_sharia": True},
    {"symbol": "JECC.JK", "name": "Jembo Cable Company Tbk", "sector": "Industrials", "subsector": "Electrical Cables", "is_sharia": True},
    {"symbol": "VOKS.JK", "name": "Voksel Electric Tbk", "sector": "Industrials", "subsector": "Electrical Cables", "is_sharia": True},
    {"symbol": "MARK.JK", "name": "Mark Dynamics Indonesia Tbk", "sector": "Industrials", "subsector": "Glove Formers", "is_sharia": True},
    {"symbol": "IMPC.JK", "name": "Impack Pratama Industri Tbk", "sector": "Industrials", "subsector": "Building Polymers", "is_sharia": True},
    {"symbol": "ARNA.JK", "name": "Arwana Citramulia Tbk", "sector": "Industrials", "subsector": "Ceramics & Tiles", "is_sharia": True},
    {"symbol": "KIAS.JK", "name": "Keramika Indonesia Assosiasi Tbk", "sector": "Industrials", "subsector": "Ceramics", "is_sharia": True},
    {"symbol": "TOTO.JK", "name": "Surya Toto Indonesia Tbk", "sector": "Industrials", "subsector": "Sanitary Ware", "is_sharia": True},
    {"symbol": "SCCO.JK", "name": "Supreme Cable Manufacturing & Commerce Tbk", "sector": "Industrials", "subsector": "Cables", "is_sharia": True},

    # =========================================================================
    # 11. TRANSPORTATION & LOGISTICS (Pelayaran, Maskapai, Taksi, Logistik Darat)
    # =========================================================================
    {"symbol": "BIRD.JK", "name": "Blue Bird Tbk", "sector": "Transportation", "subsector": "Passenger Transport", "is_sharia": True},
    {"symbol": "ASSA.JK", "name": "Adi Sarana Armada Tbk", "sector": "Transportation", "subsector": "Vehicle Rental & Courier", "is_sharia": True},
    {"symbol": "SMDR.JK", "name": "Samudera Indonesia Tbk", "sector": "Transportation", "subsector": "Shipping & Logistics", "is_sharia": True},
    {"symbol": "TMAS.JK", "name": "Temas Tbk", "sector": "Transportation", "subsector": "Container Shipping", "is_sharia": True},
    {"symbol": "GIAA.JK", "name": "Garuda Indonesia (Persero) Tbk", "sector": "Transportation", "subsector": "Airlines", "is_sharia": True},
    {"symbol": "CMPP.JK", "name": "AirAsia Indonesia Tbk", "sector": "Transportation", "subsector": "Airlines", "is_sharia": True},
    {"symbol": "HAIS.JK", "name": "Hasnur Internasional Shipping Tbk", "sector": "Transportation", "subsector": "Bulk Shipping", "is_sharia": True},
    {"symbol": "WEHA.JK", "name": "WEHA Transportasi Indonesia Tbk", "sector": "Transportation", "subsector": "Bus Transport", "is_sharia": True},
    {"symbol": "NELY.JK", "name": "Pelayaran Nelly Dwi Putri Tbk", "sector": "Transportation", "subsector": "Tug & Barge Shipping", "is_sharia": True},
    {"symbol": "TRUK.JK", "name": "Guna Timur Raya Tbk", "sector": "Transportation", "subsector": "Trucking Logistics", "is_sharia": True},
    {"symbol": "SAFE.JK", "name": "Steady Safe Tbk", "sector": "Transportation", "subsector": "Public Transport", "is_sharia": True},
    {"symbol": "BPTR.JK", "name": "Batavia Prosperindo Trans Tbk", "sector": "Transportation", "subsector": "Transportation Fleet", "is_sharia": True},
    {"symbol": "TNCA.JK", "name": "Trimuda Nuansa Citra Tbk", "sector": "Transportation", "subsector": "Air Courier & Logistics", "is_sharia": True},

    # =========================================================================
    # 12. HIGH-VELOCITY MOMENTUM & GROWTH EQUITIES (Top Gainer & Pre-ARA Scalping)
    # =========================================================================
    {"symbol": "BIKE.JK", "name": "Bhineka Inovasi Ketahanan Tbk", "sector": "Consumer Cyclicals", "subsector": "Bicycle & Consumer Goods", "is_sharia": True},
    {"symbol": "GRPH.JK", "name": "Griptha Putra Persada Tbk", "sector": "Consumer Cyclicals", "subsector": "Hotel & Tourism", "is_sharia": True},
    {"symbol": "HGII.JK", "name": "Hero Global Investment Tbk", "sector": "Financials", "subsector": "Investment Holding", "is_sharia": False},
    {"symbol": "WINE.JK", "name": "Hatten Bali Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Beverages & Winery", "is_sharia": False},
    {"symbol": "CBUT.JK", "name": "Citra Borneo Utama Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Plantation & CPO Refineries", "is_sharia": True},
    {"symbol": "BALI.JK", "name": "Bali Towerindo Sentra Tbk", "sector": "Telecommunication", "subsector": "Telecommunication Infrastructure", "is_sharia": True},
    {"symbol": "PPGL.JK", "name": "Prima Globalindo Logistik Tbk", "sector": "Industrials", "subsector": "Logistics & Freight Forwarding", "is_sharia": True},
    {"symbol": "KETR.JK", "name": "Kedoya Adyaraya Tbk", "sector": "Healthcare", "subsector": "Hospital & Healthcare Services", "is_sharia": True},
    {"symbol": "SSTM.JK", "name": "Sunson Textile Manufacture Tbk", "sector": "Consumer Cyclicals", "subsector": "Textiles & Apparel", "is_sharia": True},
    {"symbol": "LIFE.JK", "name": "Asuransi Jiwa Sinarmas MSIG Tbk", "sector": "Financials", "subsector": "Life Insurance", "is_sharia": False},
    {"symbol": "BSIM.JK", "name": "Bank Sinarmas Tbk", "sector": "Financials", "subsector": "Banks", "is_sharia": False},
    {"symbol": "OILS.JK", "name": "Indo Oil Perkasa Tbk", "sector": "Consumer Non-Cyclicals", "subsector": "Edible Oils & Commodities", "is_sharia": True},
    {"symbol": "BAJA.JK", "name": "Saranacentral Bajatama Tbk", "sector": "Basic Materials", "subsector": "Steel & Metallurgy", "is_sharia": True},
    {"symbol": "KOTA.JK", "name": "DMS Propertindo Tbk", "sector": "Properties & Real Estate", "subsector": "Property Development", "is_sharia": True},
    {"symbol": "FILM.JK", "name": "MD Entertainment Tbk", "sector": "Consumer Cyclicals", "subsector": "Entertainment & Media Production", "is_sharia": True},
    {"symbol": "ASGR.JK", "name": "Astra Graphia Tbk", "sector": "Technology", "subsector": "IT & Document Solutions", "is_sharia": True},
    {"symbol": "PACK.JK", "name": "Solusi Kemasan Digital Tbk", "sector": "Basic Materials", "subsector": "Packaging Solutions", "is_sharia": True},
    {"symbol": "FITT.JK", "name": "Hotel Fitra International Tbk", "sector": "Consumer Cyclicals", "subsector": "Hospitality & Hotels", "is_sharia": True},
    {"symbol": "NATO.JK", "name": "Surya Permata Andalan Tbk", "sector": "Properties", "subsector": "Property Investment", "is_sharia": True},
    {"symbol": "BANK.JK", "name": "Bank Aladin Syariah Tbk", "sector": "Financials", "subsector": "Digital Banking", "is_sharia": True},
    {"symbol": "KAQI.JK", "name": "Jantra Grupo Indonesia Tbk", "sector": "Industrials", "subsector": "Automotive Services", "is_sharia": True},
    {"symbol": "SQMI.JK", "name": "Wilton Makmur Indonesia Tbk", "sector": "Basic Materials", "subsector": "Gold & Mining", "is_sharia": True},
    {"symbol": "FLMC.JK", "name": "Falmaco Nonwoven Industri Tbk", "sector": "Basic Materials", "subsector": "Nonwoven Textiles", "is_sharia": True}
]

def get_full_idx_universe() -> List[Dict[str, Any]]:
    """Return complete expanded IDX universe dictionary."""
    return FULL_IDX_UNIVERSE

def get_universe_symbols() -> List[str]:
    """Return all ticker symbols ending in .JK."""
    return [item["symbol"] for item in FULL_IDX_UNIVERSE]

def get_stock_info(symbol: str) -> Optional[Dict[str, Any]]:
    """Get company metadata by symbol."""
    sym_normalized = symbol if symbol.endswith(".JK") else symbol + ".JK"
    return next((item for item in FULL_IDX_UNIVERSE if item["symbol"] == sym_normalized), None)

def is_stock_sharia(symbol: str) -> bool:
    """Check if a stock is Sharia compliant (ISSI / DES)."""
    sym_normalized = symbol if symbol.endswith(".JK") else symbol + ".JK"
    info = get_stock_info(sym_normalized)
    if info:
        return info.get("is_sharia", True)
    non_sharia_list = {
        "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "BBTN.JK", "BDMN.JK", "BNGA.JK", "ARTO.JK",
        "MEGA.JK", "BNII.JK", "PNBN.JK", "PNIN.JK", "PNLF.JK", "NISP.JK", "BJBR.JK", "BJTM.JK",
        "BBKP.JK", "BGTG.JK", "BABP.JK", "NOBU.JK", "BBYB.JK", "AGRO.JK", "AMAR.JK", "BCIC.JK",
        "BVIC.JK", "SDRA.JK", "BNLI.JK", "BNBA.JK", "MCOR.JK", "BEKS.JK", "ADMF.JK", "BFIN.JK",
        "CFIN.JK", "WOMF.JK", "TRIM.JK", "PANS.JK", "YULE.JK", "AHAP.JK", "ASDM.JK", "LPGI.JK",
        "BSIM.JK", "LIFE.JK", "HGII.JK", "HMSP.JK", "GGRM.JK", "WIIM.JK", "ITIC.JK", "MLBI.JK",
        "DLTA.JK", "WINE.JK"
    }
    return sym_normalized not in non_sharia_list

def get_sharia_universe() -> List[Dict[str, Any]]:
    """Return all Sharia compliant stocks in universe."""
    return [item for item in FULL_IDX_UNIVERSE if item.get("is_sharia", True)]
