function initialiserNavigationCompte() {
    const supabaseClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    
    async function mettreAJourBadgeEleve(bouton, userId) {
        try {
            const lastSeen = localStorage.getItem('last_seen_prives_' + userId);
            const lastDate = lastSeen ? new Date(lastSeen) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const { count } = await supabaseClient.from('fichiers_prives').select('id', { count: 'exact', head: true }).eq('eleve_id', userId).gt('created_at', lastDate.toISOString());
            if (count && count > 0) {
                bouton.innerHTML = `Compte élève <span style="background:#ef4444;color:white;font-size:.7rem;padding:2px 7px;border-radius:99px;margin-left:6px;vertical-align:middle;">${count}</span>`;
            } else {
                bouton.textContent = 'Compte élève';
            }
        } catch (e) {}
    }

    async function mettreAJourBadgeProf(bouton) {
        try {
            const { count } = await supabaseClient.from('reponses_eleves').select('id', { count: 'exact', head: true }).eq('lu', false);
            if (count && count > 0) {
                bouton.innerHTML = `Dashboard professeur <span style="background:#ef4444;color:white;font-size:.7rem;padding:2px 7px;border-radius:99px;margin-left:6px;vertical-align:middle;">${count}</span>`;
            } else {
                bouton.textContent = 'Dashboard professeur';
            }
        } catch (e) {}
    }

    supabaseClient.auth.getSession().then(async ({ data }) => {
        const session = data.session;
        let professeur = false;
        if (session) {
            const { data: profil } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
            professeur = profil?.role === 'professeur';
        }

        for (const bouton of document.querySelectorAll('.actions-compte button:first-child')) {
            if (!session) {
                bouton.textContent = 'S’inscrire';
            } else if (professeur) {
                await mettreAJourBadgeProf(bouton);
                // Temps réel réponses élèves -> prof
                supabaseClient.channel('badge-prof-' + session.user.id)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reponses_eleves' }, () => {
                        mettreAJourBadgeProf(bouton);
                    })
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reponses_eleves' }, () => {
                        mettreAJourBadgeProf(bouton);
                    })
                    .subscribe();
            } else {
                await mettreAJourBadgeEleve(bouton, session.user.id);
                // Temps réel fichiers privés -> élève
                supabaseClient.channel('badge-eleve-' + session.user.id)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fichiers_prives', filter: `eleve_id=eq.${session.user.id}` }, () => {
                        mettreAJourBadgeEleve(bouton, session.user.id);
                    })
                    .subscribe();
            }
            bouton.onclick = () => { window.location.href = session ? (professeur ? 'dashboard.html' : 'Mon espace-eleves.html') : 'inscription.html'; };
        }

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