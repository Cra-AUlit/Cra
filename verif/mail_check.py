"""python3 verif/mail_check.py — relit le message MIME comme un client mail."""
import email, json, os, sys
from email import policy
D = os.path.dirname(os.path.abspath(__file__))
m = email.message_from_bytes(open(os.path.join(D, 'sortie/message.eml'), 'rb').read(), policy=policy.default)
exp = json.load(open(os.path.join(D, 'sortie/message.json'), encoding='utf-8'))
assert m['To'] == 'paie@izencia.fr, rh@izencia.fr', m['To']
assert m['Cc'] == 'moi@gmail.com'
assert str(m['Subject']) == exp['subject'], repr(str(m['Subject']))
parts = list(m.iter_parts())
assert parts[0].get_content().replace('\r\n', '\n').rstrip('\n') == exp['body']
att = parts[1]
assert att.get_filename() == 'CRA_izencia_2026-09_Tertereau_Olivier.xlsx'
assert att.get_content_type() == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
assert att.get_content() == open(os.path.join(D, 'sortie/CRA_2026-09.xlsx'), 'rb').read(), 'pièce jointe altérée'
print('OK mail_check : objet, texte et pièce jointe identiques')
