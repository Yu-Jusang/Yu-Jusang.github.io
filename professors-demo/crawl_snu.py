"""Fetch the public SNU course search for 2027 spring.

Run from the repository root: python professors-demo/crawl_snu.py
The crawler never logs in and stops without writing if the result is incomplete.
"""

from __future__ import annotations

import json
import math
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup


BASE = "https://sugang.snu.ac.kr"
HOME = BASE + "/sugang/co/co010.action"
SEARCH = BASE + "/sugang/cc/cc100InterfaceSrch.action"
TERM = "U000200001U000300001"
OUTPUT = Path(__file__).with_name("courses.json")
KST = timezone(timedelta(hours=9))


def request(session: requests.Session, method: str, url: str, **kwargs) -> requests.Response:
    for attempt in range(4):
        try:
            response = session.request(method, url, timeout=40, **kwargs)
            response.raise_for_status()
            response.encoding = "utf-8"
            return response
        except requests.RequestException:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


def parse_page(html: str) -> tuple[int, list[dict]]:
    soup = BeautifulSoup(html, "html.parser")
    count_node = soup.select_one(".search-result-con .fc-orange")
    if count_node is None:
        raise ValueError("공식 검색 결과의 총 강좌 수를 찾지 못했습니다.")
    total = int(count_node.get_text(strip=True).replace(",", ""))
    rows = []
    for anchor in soup.select('a[id^="course_info_detail_"]'):
        box = anchor.find_parent(class_="course-info-item")
        if box is None:
            raise ValueError("강좌 항목 구조가 바뀌었습니다.")
        hidden = {tag.get("name"): tag.get("value", "") for tag in box.select('input[type="hidden"]')}
        if hidden.get("openSchyy") != "2027" or hidden.get("openShtmFg") != "U000200001":
            raise ValueError("2027년 1학기가 아닌 강좌가 반환됐습니다.")
        name_node = anchor.select_one(".course-name")
        info = anchor.select("ul.course-info > li.txt")
        if name_node is None or len(info) < 2:
            raise ValueError("강좌의 필수 항목이 없습니다.")
        labels = re.findall(r"\[([^]]+)\]", name_node.get_text(" ", strip=True))
        basic = info[0].find_all("span", recursive=False)
        credits_node = next((span.find("em") for span in info[1].find_all("span", recursive=False)
                             if "학점" in span.get_text(" ", strip=True)), None)
        if len(basic) < 3 or credits_node is None:
            raise ValueError("교수·학과·학점 항목이 없습니다.")
        course_time = hidden.get("ltTimeForTT", "").strip()
        row = {
            "course": hidden.get("sbjtNm", "").strip(),
            "code": hidden.get("sbjtCd", "").strip(),
            "section": hidden.get("ltNo", "").strip(),
            "department": basic[1].get_text(" ", strip=True) or "미공개",
            "college": "",
            "level": labels[0] if labels else "",
            "major": labels[1] if len(labels) > 1 else "",
            "year": "",
            "professor": basic[0].get_text(" ", strip=True) or "미정",
            "credits": credits_node.get_text(" ", strip=True),
            "time": course_time or "미공개",
        }
        if not row["course"] or not row["code"] or not row["department"]:
            raise ValueError(f"불완전한 강좌 항목: {row!r}")
        rows.append(row)
    return total, rows


def main() -> None:
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; CourseStatusBot/1.0; public course search)"})
    request(session, "GET", BASE + "/")
    request(session, "GET", HOME, headers={"Referer": BASE + "/"})
    all_rows = []
    total = None
    page = 1
    while True:
        response = request(session, "POST", SEARCH,
                           headers={"Referer": HOME},
                           data={"workType": "S", "srchCond": "1", "pageNo": str(page),
                                 "srchOpenSchyy": "2027", "srchOpenShtm": TERM})
        found_total, rows = parse_page(response.text)
        if total is None:
            total = found_total
            if total < 1000:
                raise ValueError(f"강좌 수가 예상보다 적어 저장하지 않습니다: {total}")
        if found_total != total or not rows:
            raise ValueError(f"{page}쪽에서 결과가 달라지거나 비었습니다.")
        all_rows.extend(rows)
        print(f"{page}/{math.ceil(total / 10)}쪽 · {len(all_rows)}/{total}강좌", flush=True)
        if len(all_rows) >= total:
            break
        page += 1
        time.sleep(0.8)
    keys = [(r["code"], r["section"]) for r in all_rows]
    if len(all_rows) != total or len(set(keys)) != total:
        raise ValueError("전체 강좌 수 또는 과목번호·분반의 중복 검사에 실패했습니다.")
    payload = {"semester": "2027-1", "source": SEARCH,
               "checkedAt": datetime.now(KST).isoformat(timespec="seconds"),
               "count": total, "courses": all_rows}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"저장 완료: {OUTPUT} ({total}강좌)")


if __name__ == "__main__":
    main()

