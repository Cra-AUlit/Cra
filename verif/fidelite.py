"""python3 verif/fidelite.py — compare le CRA généré au modèle d'origine.
Tout doit être identique (styles, fusions, MFC, validations, colonnes cachées,
commentaires, mise en page) sauf les cellules de saisie."""
import sys, os, openpyxl, datetime
D = os.path.dirname(os.path.abspath(__file__))
tpl = openpyxl.load_workbook(os.path.join(D, '../web/modele/CRA_izencia.xlsx'))['Technicien']
gen_wb = openpyxl.load_workbook(os.path.join(D, 'sortie/CRA_2026-09.xlsx'))
gen = gen_wb['Technicien']
val = openpyxl.load_workbook(os.path.join(D, 'sortie/CRA_2026-09.xlsx'), data_only=True)['Technicien']
err = []
def check(c, m):
    if not c: err.append(m)

SAISIE = {'C1', 'H1', 'B2', 'D2', 'S5'} | {f'S{r}' for r in range(6, 17)} | {f'{c}{r}' for c in 'BCDEFGHI' for r in range(6, 37)}
for row in tpl.iter_rows(min_row=1, max_row=100, max_col=19):
    for a in row:
        b = gen[a.coordinate]
        check(a.style_id == b.style_id or a._style == b._style, f'style {a.coordinate}')
        if a.coordinate not in SAISIE:
            check(a.value == b.value, f'valeur/formule modifiée {a.coordinate}: {a.value!r} -> {b.value!r}')
check(set(map(str, tpl.merged_cells.ranges)) == set(map(str, gen.merged_cells.ranges)), 'fusions')
check(len(tpl.conditional_formatting) == len(gen.conditional_formatting), 'MFC')
check(len(tpl.data_validations.dataValidation) == len(gen.data_validations.dataValidation), 'validations')
for k, v in tpl.column_dimensions.items():
    check(v.hidden == gen.column_dimensions[k].hidden and v.width == gen.column_dimensions[k].width, f'colonne {k}')
for r in range(1, 44):
    check(tpl.row_dimensions[r].height == gen.row_dimensions[r].height, f'hauteur ligne {r}')
check(tpl.freeze_panes == gen.freeze_panes, 'volets figés')
check(tpl.oddHeader.center.text == gen.oddHeader.center.text, 'en-tête impression')
check(len([c for r in gen.iter_rows() for c in r if c.comment]) == 10, 'commentaires')

# valeurs saisies + caches
check(gen['C1'].value == 'TERTEREAU OLIVIER' and gen['H1'].value == 'Sopra Steria projet BNPP', 'en-têtes')
check(gen['B2'].value == 9 and gen['D2'].value == 2026, 'mois/année')
check(val['A6'].value == datetime.datetime(2026, 9, 1), f'cache A6 {val["A6"].value}')
check(val['A35'].value == datetime.datetime(2026, 9, 30), 'cache A35')
check(val['A36'].value in ('', None), f'cache A36 {val["A36"].value!r}')
check(gen['C12'].value == 1 and gen['B20'].value == 0.5 and gen['C20'].value == 0.5 and gen['D27'].value == 1, 'saisies')
check(gen['G15'].value == 2 and gen['H15'].value == 1.5, 'HS')
check(val['B37'].value == 19.5 and val['C37'].value == 1.5 and val['D37'].value == 1, f'totaux {val["B37"].value} {val["C37"].value}')
check(val['G37'].value == 3.5 and val['G38'].value == 2 and val['H38'].value == 1.5, 'totaux HS')
check(len(gen._images) == 1, 'signature')

print('\n'.join(err) if err else 'OK fidélité : seul le contenu saisi diffère du modèle')
sys.exit(1 if err else 0)
