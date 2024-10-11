from flask import Flask, render_template, request, redirect, send_file
import csv
import os

app = Flask(__name__)

def est_nombre(valeur):
    try:
        int(valeur)
        return True
    except ValueError:
        return False

def modifier_csv(fichier_entree, fichier_sortie):
    colonnes_utiles = ['CODE_BARRE', 'CONTRA', 'descript', 'MARQUE']
    
    with open(fichier_entree, mode='r', newline='', encoding='utf-8') as fichier_csv:
        lecteur = csv.DictReader(fichier_csv)
        lignes_filtrees = []
        
        for ligne in lecteur:
            if est_nombre(ligne.get('QTE')) and int(ligne['QTE']) != 0:
                ligne_filtre = {colonne: ligne[colonne] for colonne in colonnes_utiles}
                lignes_filtrees.append(ligne_filtre)
        
        with open(fichier_sortie, mode='w', newline='', encoding='utf-8') as fichier_csv_modifie:
            auteur = csv.DictWriter(fichier_csv_modifie, fieldnames=colonnes_utiles)
            auteur.writeheader()
            auteur.writerows(lignes_filtrees)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return redirect('/')
    
    file = request.files['file']
    if file.filename == '':
        return redirect('/')
    
    # Sauvegarder le fichier téléchargé
    chemin_fichier = os.path.join('uploads', file.filename)
    file.save(chemin_fichier)
    
    # Modifier le fichier CSV juste après l'upload
    fichier_modifie = os.path.join('uploads', 'fichier_modifie.csv')
    modifier_csv(chemin_fichier, fichier_modifie)
    
    # Renvoyer le fichier modifié en téléchargement
    return send_file(fichier_modifie, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)