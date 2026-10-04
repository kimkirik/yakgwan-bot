"""Fictional test policy. Not an insurer's terms or insurance advice."""
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.colors import HexColor
from pathlib import Path
pdfmetrics.registerFont(UnicodeCIDFont('HYSMyeongJo-Medium'))
Path('public').mkdir(exist_ok=True)
c=canvas.Canvas('public/sample-policy.pdf',pagesize=(595,842))
c.setTitle('체험용 가상보험약관 - 실제 보험상품이 아닙니다')
pages=[
('보장 내용과 지급 한도',[
'이 문서는 약관돋보기 기능을 확인하기 위한 가상 예시입니다.',
'실제 보험상품, 가입 내용, 보험금 지급 기준이 아닙니다.',
'',
'제1조 입원급여금',
'피보험자가 질병 또는 상해의 치료를 직접 목적으로 입원한 경우,',
'입원 1일당 30,000원을 지급합니다. 1회 입원당 최대 30일입니다.',
'입원 필요성과 치료 목적에 대한 확인 서류를 제출해야 합니다.',
'',
'제2조 수술급여금',
'이 가상 약관에서 정한 치료 목적의 수술을 받은 경우',
'수술 1회당 500,000원을 지급합니다. 연간 최대 2회입니다.',
'단순 검사, 미용 목적 시술은 수술급여금의 지급 대상이 아닙니다.',
'',
'제3조 일반암 진단급여금',
'보장개시일 이후 일반암으로 진단이 확정된 경우',
'최초 1회에 한하여 10,000,000원을 지급합니다.',
'유사암의 정의와 지급 여부는 별도 특약을 확인해야 합니다.',
]),
('제외 조건과 보장개시일',[
'가상 예시 - 실제 보험 보장을 판단하는 데 사용할 수 없습니다.',
'',
'제4조 보험금을 지급하지 않는 사유',
'미용을 목적으로 한 성형수술은 보장하지 않습니다.',
'피보험자의 고의로 발생한 사고에 대해서는 보험금을 지급하지 않습니다.',
'질병의 치료와 관계없는 단순 건강검진은 보장하지 않습니다.',
'',
'제5조 암 보장개시일 및 감액',
'일반암 보장은 계약일로부터 90일이 지난 날의 다음 날부터 시작합니다.',
'보장개시일 전에 진단된 암에 대해서는 진단급여금을 지급하지 않습니다.',
'계약일부터 1년 미만에 지급 사유가 발생하면 가입금액의 50%를 지급합니다.',
'',
'제6조 실제 가입 담보 확인',
'이 문서에 담보가 기재되어 있더라도 실제 가입을 뜻하지 않습니다.',
'보험증권의 가입 특약, 가입금액, 피보험자와 계약일을 확인해야 합니다.',
]),
('보험금 청구와 서류',[
'가상 예시 - 실제 보험사의 청구 절차와 다를 수 있습니다.',
'',
'제7조 보험금 청구 시 제출 서류',
'보험금 청구서, 신분증 사본, 진단서, 진료비 영수증을 제출합니다.',
'입원급여금 청구 시 입퇴원 확인서와 진료비 세부내역서가 필요합니다.',
'수술급여금 청구 시 수술확인서가 필요합니다.',
'암 진단급여금 청구 시 병리검사 결과지를 추가로 제출합니다.',
'',
'제8조 추가 확인',
'보험사는 지급 사유 확인을 위해 필요한 추가 자료를 요청할 수 있습니다.',
'최종 지급 여부와 지급 금액은 실제 계약 내용 및 심사에 따라 정해집니다.',
])]
for n,(title,lines) in enumerate(pages,1):
 c.setFillColor(HexColor('#193e37'));c.rect(0,750,595,92,fill=1,stroke=0)
 c.setFillColor(HexColor('#d9f48f'));c.setFont('HYSMyeongJo-Medium',12);c.drawString(42,809,'약관돋보기  /  기능 체험용 가상 약관')
 c.setFillColor(HexColor('#ffffff'));c.setFont('HYSMyeongJo-Medium',22);c.drawString(42,773,title)
 y=702
 for line in lines:
  c.setFillColor(HexColor('#263e37'));c.setFont('HYSMyeongJo-Medium',13 if line.startswith('제') else 11)
  c.drawString(42,y,line);y-=27 if line.startswith('제') else 24
 c.setFillColor(HexColor('#71816b'));c.setFont('HYSMyeongJo-Medium',10);c.drawString(42,45,'실제 보험상품이 아닙니다. 모든 조건과 금액은 테스트용 예시입니다.')
 c.drawRightString(550,45,str(n));c.showPage()
c.save()
print('Created public/sample-policy.pdf (3 pages, fictional).')
