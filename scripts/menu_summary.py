"""Render a reproducible comparison of the public menu observations."""
from html import escape
import json


def menu_summary(stage):
    shops = json.loads((stage / "data/shops.json").read_text())
    rows = []
    for shop in shops:
        price = shop["prices"]["entry"]
        source = escape(shop["menu"], quote=True)
        label = escape(f"{shop['name']} · {shop['area']}")
        sauce = next((s for s in shop["sauces"] if s.get("oz") == 4), None)
        order = f"${(2 * price + sauce['cents']) / 100:.2f}" if sauce else "4 oz price unlisted"
        observed = escape(shop["checked"])
        if shop.get("menuDate"):
            observed += " (menu dated " + escape(shop["menuDate"]) + ")"
        rows.append(f'<tr><th scope="row"><a href="{source}">{label}</a></th>'
                    f'<td>{escape(shop["entryLabel"])} · ${price / 100:.2f}</td><td>{order}</td><td>{observed}</td></tr>')
    return """<section class="wrap menu-summary"><h2>Halifax donair menu prices by counter</h2>
<p>The first price buys one entry-size donair. The order column prices two entry-size donairs and one extra
4 oz sauce where the menu gives that exact size. Figures are Canadian dollars before tax, tips and delivery.</p>
<div class="menu-scroll"><table><caption>Published pickup menu observations</caption><thead><tr>
<th scope="col">Branch and menu</th><th scope="col">One donair</th><th scope="col">Two with extra sauce</th>
<th scope="col">Menu checked</th></tr></thead><tbody>""" + "".join(rows) + """</tbody></table></div>
<p><a href="#planner">Change the order or pickup time</a> · <a href="/clamcounter/">Compare Halifax clams and chips menus</a>
 · <a href="/inspectiontrail/">Find a Nova Scotia restaurant inspection</a></p></section>"""
