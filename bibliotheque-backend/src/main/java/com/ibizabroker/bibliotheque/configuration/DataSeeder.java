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
 * Pré-enregistre les données de test (CA encadré) :
 * <ul>
 *   <li>2 rôles : Admin, User</li>
 *   <li>5 comptes : A1 (Admin+User), A2-A5 (User), mots de passe a1..a5</li>
 *   <li>6 livres : B1..B6, 2 exemplaires chacun</li>
 *   <li>L1 (B1) : Disponible — aucun emprunt en cours</li>
 *   <li>L2-L5 (B2-B5) : Tous empruntés et non rendus (0 exemplaires restants)</li>
 *   <li>L6 (B6) : Disponible — aucun emprunt en cours</li>
 *   <li>A1 : Réservataire principal</li>
 *   <li>A2 : Celui qui saturera son quota (3 réservations)</li>
 *   <li>A3 : L'emprunteur — détient L2-L5</li>
 * </ul>
 * Idempotent : rien n'est recréé si les tables contiennent déjà des données.
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
        seedPreloadBorrows(users, books);
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
            System.out.println("[seed] Comptes déjà présents, rien à faire.");
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
            System.out.println("[seed] Livres déjà présents, rien à faire.");
            return booksRepository.findAll();
        }
        List<Books> created = new ArrayList<>();
        for (String identifiant : BOOK_IDENTIFIANTS) {
            Books book = new Books();
            book.setBookName(identifiant);
            book.setBookAuthor("Auteur " + identifiant);
            book.setBookGenre("Divers");
            book.setNoOfCopies(COPIES_PAR_LIVRE);
            book.setDisponible(true);
            created.add(booksRepository.save(book));
        }
        System.out.println("[seed] 6 livres créés : B1..B6 (2 exemplaires chacun, disponibles).");
        return created;
    }

    /**
     * Précharge les emprunts selon le CA :
     * <ul>
     *   <li>L1 (B1) : Disponible — aucun emprunt</li>
     *   <li>L2-L5 (B2-B5) : Tous empruntés (2 copies chacun) par A3 + A4 → 0 restants, indisponibles</li>
     *   <li>L6 (B6) : Disponible — aucun emprunt</li>
     * </ul>
     */
    private void seedPreloadBorrows(List<Users> users, List<Books> books) {
        if (borrowRepository.count() > 0) {
            System.out.println("[seed] Emprunts déjà présents, rien à faire.");
            return;
        }

        Users a3 = findUser(users, "A3");
        Users a4 = findUser(users, "A4");

        // L2-L5 (B2-B5) : toutes les copies empruntées par A3 + A4 → indisponibles
        for (String bookName : List.of("B2", "B3", "B4", "B5")) {
            Books book = findBook(books, bookName);

            // 1ère copie → A3
            createBorrow(a3.getUserId(), book);
            book.borrowBook();

            // 2ème copie → A4
            createBorrow(a4.getUserId(), book);
            book.borrowBook();

            book.setDisponible(book.getNoOfCopies() > 0);
            booksRepository.save(book);
            System.out.println("[seed] " + bookName + " : 2 copies empruntées (A3+A4), restant : " + book.getNoOfCopies() + ", disponible=" + book.getDisponible());
        }

        System.out.println("[seed] Seed terminé : L1(B1) dispo, L2-L5(B2-B5) empruntés, L6(B6) dispo.");
    }

    private void createBorrow(Integer userId, Books book) {
        Borrow borrow = new Borrow();
        borrow.setBookId(book.getBookId());
        borrow.setUserId(userId);
        Date now = new Date();
        borrow.setIssueDate(now);
        borrow.setDueDate(addDays(now, DUREE_EMPRUNT_JOURS));
        borrow.setReturnDate(null);
        borrowRepository.save(borrow);
    }

    private Users findUser(List<Users> users, String username) {
        return users.stream().filter(u -> username.equals(u.getUsername())).findFirst().orElseThrow();
    }

    private Books findBook(List<Books> books, String bookName) {
        return books.stream().filter(b -> bookName.equals(b.getBookName())).findFirst().orElseThrow();
    }

    private static String passwordTo(String identifiant) {
        return identifiant.toLowerCase();
    }

    private static Date addDays(Date source, int days) {
        Calendar c = Calendar.getInstance();
        c.setTime(source);
        c.add(Calendar.DATE, days);
        return c.getTime();
    }
}
