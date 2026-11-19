"""Exercise the pickup planner at a project subpath in Chromium."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    screenshots = ROOT / "browser-checks"
    screenshots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        shutil.copytree(ROOT / "dist", Path(temporary) / "example-tool")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=temporary))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
                page = browser.new_page(viewport={"width": 1280, "height": 1000})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/example-tool/")
                page.locator("#late").click()
                page.wait_for_selector("article.card")
                assert "2 of 5" in page.locator("#summary").inner_text()
                assert page.locator("article.card").count() == 5
                assert "$20.60" in page.locator("article.card").first.inner_text()
                page.locator("article.card").first.locator("summary").click()
                assert "Friday" in page.locator("details[open]").inner_text()
                page.locator("#filter").select_option("open")
                assert page.locator("article.card").count() == 2
                page.locator("#sauce").select_option("4oz")
                assert "Unpriced" in page.locator("article.card").first.inner_text()
                page.locator("#cups").select_option("0")
                page.locator("#tax").check()
                page.locator("#save").click()
                page.locator("#qty").select_option("8")
                page.locator("#restore").click()
                assert page.locator("#qty").input_value()=="2"
                page.reload()
                assert page.locator("#cups").input_value()=="0"
                assert page.locator("#tax").is_checked()
                page.locator("#date").fill("2027-03-14")
                page.locator("#time").fill("02:30")
                assert "spring clock change" in page.locator("#summary").inner_text()
                page.locator("#cups").select_option("1")
                page.locator("#sauce").select_option("smallest")
                page.locator("#tax").uncheck()
                page.locator("#late").click()
                page.screenshot(path=str(screenshots / "desktop.png"), full_page=True)
                page.set_viewport_size({"width": 390, "height": 844})
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                page.screenshot(path=str(screenshots / "mobile.png"), full_page=True)
                assert not errors, errors
                browser.close()
            print("Browser checks passed: project subpath, overnight hours, sauce volumes, saved baskets, DST and mobile layout")
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
