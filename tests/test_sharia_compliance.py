import pytest
from src.data.universe import is_stock_sharia

def test_sharia_known_symbols():
    # Known Sharia (ISSI / DES OJK)
    assert is_stock_sharia("TLKM.JK") is True
    assert is_stock_sharia("ASII.JK") is True
    assert is_stock_sharia("ICBP.JK") is True
    assert is_stock_sharia("BRIS.JK") is True
    
    # Known Non-Sharia Conventional Banks / Alcohol / Tobacco
    assert is_stock_sharia("BBCA.JK") is False
    assert is_stock_sharia("BBRI.JK") is False
    assert is_stock_sharia("BMRI.JK") is False
    assert is_stock_sharia("BBNI.JK") is False
    assert is_stock_sharia("GGRM.JK") is False
    assert is_stock_sharia("HMSP.JK") is False
