package com.ibizabroker.bibliotheque.configuration;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.BorrowRepository;
import com.ibizabroker.bibliotheque.dao.RoleRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Borrow;
import com.ibizabroker.bibliotheque.entity.Role;
import com.ibizabroker.bibliotheque.entity.Users;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Pré-enregistre au démarrage la donnée d'évaluation (CA encadrer) :
 *  - 2 rôles : Admin, User
 *  - 5 comptes utilisateurs : A1 (Admin + User) et A2..A5 (User), mots de passe a1..a5
 *  - 6 livres : B1..B6, 2 exemplaires chacun, disponibles
 *  - 1 emprunt préchargé : A1 a emprunté B1 (borrowId = 1)
 * <p>
 * Idempotent : rien n'est recréé si les tables contiennent déjà des données.
 * C'est la source fiable des comptes/livres (le seed.sh Docker cible MySQL est obsolète).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final List<String> USER_IDENTIFIANTS = List.of("A1", "A2", "A3", "A4", "A5");
    private static final List<String> BOOK_IDENTIFIANTS = List.of("B1", "B2", "B3", "B4", "B5", "B6");
    private static final int COPIES_PAR_LIVRE = 2;
    private static final int DUREE_EMPRUNT_JOURS = 7;

    private final UsersRepository usersRepository;
    private final RoleRepository roleRepository;
    private final BooksRepository booksRepository;
    private final BorrowRepository borrowRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UsersRepository usersRepository,
                      RoleRepository roleRepository,
                      BooksRepository booksRepository,
                      BorrowRepository borrowRepository,
                      PasswordEncoder passwordEncoder) {
        this.usersRepository = usersRepository;
        this.roleRepository = roleRepository;
        this.booksRepository = booksRepository;
        this.borrowRepository = borrowRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Set<Role> roles = seedRoles();
        List<Users> users = seedUsers(roles);
        List<Books> books = seedBooks();
        seedPreloadBorrow(users, books);
    }

    private Set<Role> seedRoles() {
        Role adminRole = roleRepository.findByRoleName("Admin")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setRoleName("Admin");
                    return roleRepository.save(r);
                });
        Role userRole = roleRepository.findByRoleName("User")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setRoleName("User");
                    return roleRepository.save(r);
                });
        return new HashSet<>(Set.of(adminRole, userRole));
    }

    private List<Users> seedUsers(Set<Role> roles) {
        if (usersRepository.count() > 0) {
            System.out.println("[seed] Comptes A1..A5 déjà présents, rien à faire.");
            return usersRepository.findAll();
        }
        Role adminRole = roles.stream().filter(r -> "Admin".equals(r.getRoleName())).findFirst().orElseThrow();
        Role userRole = roles.stream().filter(r -> "User".equals(r.getRoleName())).findFirst().orElseThrow();

        List<Users> created = new ArrayList<>();
        for (String identifiant : USER_IDENTIFIANTS) {
            Users user = new Users();
            user.setUsername(identifiant);
            user.setName(identifiant);
            user.setPassword(passwordEncoder.encode(passwordTo(identifiant)));
            // A1 est le compte "full flux" (Admin + User) : login -> crud -> borrow -> return -> logout.
            // A2..A5 sont des adhérents classiques (User) : emprunt / retour.
            Set<Role> userRoles = new HashSet<>();
            userRoles.add(userRole);
            if (identifiant.equals("A1")) {
                userRoles.add(adminRole);
            }
            user.setRole(userRoles);
            created.add(usersRepository.save(user));
        }
        System.out.println("[seed] 5 comptes créés : A1 (Admin+User) et A2..A5 (User), mots de passe a1..a5.");
        return created;
    }

    private List<Books> seedBooks() {
        if (booksRepository.count() > 0) {
            System.out.println("[seed] Livres B1..B6 déjà présents, rien à faire.");
            return booksRepository.findAll();
        }
        List<Books> created = new ArrayList<>();
        int rank = 1;
        for (String identifiant : BOOK_IDENTIFIANTS) {
            Books book = new Books();
            book.setBookName(identifiant);
            book.setBookAuthor("Auteur " + identifiant);
            book.setBookGenre("Divers");
            book.setNoOfCopies(COPIES_PAR_LIVRE);
            book.setDisponible(true);
            created.add(booksRepository.save(book));
            rank++;
        }
        System.out.println("[seed] 6 livres créés : B1..B6 (2 exemplaires chacun, disponibles).");
        return created;
    }

    /**
     * Précharge l'emprunt A1 -> B1 (CA encadrer : "A1 a emprunté B1").
     * B1 repasse à 1 exemplaire disponible. Idempotent : un seul borrow seed si la table est vide.
     */
    private void seedPreloadBorrow(List<Users> users, List<Books> books) {
        if (borrowRepository.count() > 0) {
            return;
        }
        Users a1 = users.stream().filter(u -> "A1".equals(u.getUsername())).findFirst().orElseThrow();
        Books b1 = books.stream().filter(b -> "B1".equals(b.getBookName())).findFirst().orElseThrow();

        Borrow borrow = new Borrow();
        borrow.setBookId(b1.getBookId());
        borrow.setUserId(a1.getUserId());
        Date now = new Date();
        borrow.setIssueDate(now);
        borrow.setDueDate(addDays(now, DUREE_EMPRUNT_JOURS));
        borrow.setReturnDate(null);
        borrowRepository.save(borrow);

        // B1 : un exemplaire est sorti -> 2 -> 1, toujours disponible.
        b1.borrowBook();
        b1.setDisponible(b1.getNoOfCopies() != null && b1.getNoOfCopies() > 0);
        booksRepository.save(b1);

        System.out.println("[seed] A1 a emprunté B1 (borrowId=" + borrow.getBorrowId()
                + ") ; B1 restant : " + b1.getNoOfCopies() + " exemplaire(s).");
    }

    private static String passwordTo(String identifiant) {
        // Convention CA : mot de passe en minuscule, identique à l'identifiant.
        return identifiant.toLowerCase();
    }

    private static Date addDays(Date source, int days) {
        Calendar c = Calendar.getInstance();
        c.setTime(source);
        c.add(Calendar.DATE, days);
        return c.getTime();
    }
}
