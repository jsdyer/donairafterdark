# Donair After Dark

[Compare Halifax pickup options](https://coolcode.ca/donairafterdark/) · [CoolCode](https://coolcode.ca/)

<!-- coolcode:guide -->
Try Saturday at 12:45 a.m. to see Friday’s hours carry past midnight at Tony’s and Metro Pizza. Compare two entry-size donairs with the smallest extra sauce, or request exactly 4 oz to see which menus publish that portion. Save your usual basket on this device.
<!-- /coolcode:guide -->

## Ordering

Compare five pickup addresses across four businesses by Halifax date and time. The default basket of two entry-size plain donairs and one smallest extra sauce costs $19.08 at each King of Donair branch, $20.60 at Tony’s, $21.85 at Metro and $22.75 at Zesty before tax. King of Donair sells a 2 oz portion and Zesty sells 4 oz. Both Tony’s and Metro name their small cups without specifying a volume. Each branch links its published menu, source for weekly hours, telephone number and map.

Choose entry, medium or large donairs and up to twelve extra sauces. “Next size up” picks the shop’s second listed sauce portion. An exact 4 oz order is unpriced wherever a matching portion cannot be verified. Prices use integer Canadian cents. Nova Scotia’s 14% HST estimate rounds once on the basket subtotal. The planner supports dates from April 1, 2025, when that rate took effect. It applies the published snapshot and weekly hours to the date selected. It does not reconstruct earlier menus, predict future prices or account for holiday changes. [CRA rate table](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html)

Opening times are inclusive and closing times exclusive. After midnight the app also considers the preceding day’s shift. Unknown hours are a separate result group. At Metro, Sunday lists a 4 p.m. opening without a closing time. Its Sunday evening and subsequent early Monday hours therefore need a call. The two King of Donair branch entries each link the same 2024 PDF and omit counter hours. Delivery-platform hours can differ.

## Sources and dates

- [King of Donair branches](https://www.kingofdonair.ca/order-online-choose-a-location/) and the [linked menu](https://www.kingofdonair.ca/wp-content/user_files/2024/10/24-KOD-MENU-WEB.pdf). Page 1 prices original donairs and page 3 prices sauce. The PDF creation metadata gives October 28, 2024.
- [Tony’s menu and weekly hours](https://www.tonysdonair.com/donairs) for 2390 Robie Street.
- [Zesty donair menu](https://zestypizza.ca/menu/donairs) and [weekly hours](https://zestypizza.ca/) for 477 Herring Cove Road. The source’s medium cup has an ambiguous printed volume.
- [Metro Pizza menu](https://metropizzahalifax.ca/menu) and its [contact page with expandable hours](https://metropizzahalifax.ca/contact-us) for 6021 Lady Hammond Road.

Undated HTML menus retain an unknown menu date. The separate branch review dates record the last manual check against posted sources. The catalogue probe reports the oldest branch review date and the branch count. Inputs stay in the browser. Saving a usual basket writes only the chosen quantities, sizes and tax preference to local storage. Source, call and map links open the corresponding external service.

## Maintaining the snapshot

Weekly GitHub Actions checks compare published menu sections, the branch PDF links and file digest, and the contact-page hours widget against reviewed fingerprints. A changed source or parsing failure opens or updates the review issue. The check never republishes prices or advances review dates. The last reviewed site stays available throughout.

1. Inspect each changed source. Confirm that the branch, dish and stated portions still match. Review all locations if accepting new fingerprints for the whole set.
2. Update affected branch entries in `web/data/shops.json`. Keep the original menu date separate from the day you examined the source. Update `web/data/status.json` with the oldest checked date and the number of branches.
3. Run `python3 scripts/watch.py --accept-reviewed` to accept source fingerprints after examining the sources. Review and commit the diff, then close the review issue. Run `python3 scripts/watch.py` for a read-only comparison.
4. Run `node --test tests/*.test.mjs`, `python3 -m unittest discover -s tests -v`, and `python3 scripts/build.py`. To test the browser, install `tests/browser-requirements.txt` and Playwright Chromium, then run `python3 tests/browser_smoke.py`. An existing Chromium executable can be set with `CHROMIUM_PATH`. Main builds publish to GitHub Pages.

The app builds offline. The cropped menu photograph by Paulo O is distributed under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). [Original photograph](https://commons.wikimedia.org/wiki/File:Donair_(47003391564).jpg). Archivo Black is distributed under the SIL Open Font License included in `web/assets/archivo-license.txt`.
