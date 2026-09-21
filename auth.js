function initialiserNavigationCompte() {
    const supabaseClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    supabaseClient.auth.getSession().then(async ({ data }) => {
        const session = data.session;
        let professeur = false;
        if (session) {
            const profil = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
            professeur = profil.data?.role === 'professeur';
        }
        document.querySelectorAll('.actions-compte button:first-child').forEach(bouton => {
            bouton.textContent = session ? (professeur ? 'Dashboard professeur' : 'Compte élève') : 'S’inscrire';
            bouton.onclick = () => { window.location.href = session ? (professeur ? 'dashboard.html' : 'TD.html') : 'inscription.html'; };
        });
        document.querySelectorAll('.actions-compte button:last-child').forEach(bouton => {
            bouton.textContent = session ? 'Se déconnecter' : 'Se connecter';
            bouton.onclick = async () => {
                if (session) { await supabaseClient.auth.signOut(); window.location.reload(); }
                else window.location.href = 'connexion.html';
            };
        });
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiserNavigationCompte);
else initialiserNavigationCompte();
