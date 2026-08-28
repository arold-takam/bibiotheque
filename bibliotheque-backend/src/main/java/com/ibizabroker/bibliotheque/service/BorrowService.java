package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.BorrowRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Borrow;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import com.ibizabroker.bibliotheque.exceptions.RuleViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service
public class BorrowService {

    private final BorrowRepository borrowRepository;
    private final UsersRepository usersRepository;
    private final BooksRepository booksRepository;
    private final ReservationRepository reservationRepository;

    public BorrowService(BorrowRepository borrowRepository,
                         UsersRepository usersRepository,
                         BooksRepository booksRepository,
                         ReservationRepository reservationRepository) {
        this.borrowRepository = borrowRepository;
        this.usersRepository = usersRepository;
        this.booksRepository = booksRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public String borrowBook(Borrow borrow) {
        Users user = usersRepository.findById(borrow.getUserId())
                .orElseThrow(() -> new NotFoundException("User with id " + borrow.getUserId() + " does not exist."));
        Books book = booksRepository.findById(borrow.getBookId())
                .orElseThrow(() -> new NotFoundException("Book with id " + borrow.getBookId() + " does not exist."));

        boolean disponible = book.getDisponible() != null ? book.getDisponible() : book.getNoOfCopies() > 0;
        if (!disponible || book.getNoOfCopies() == null || book.getNoOfCopies() < 1) {
            throw new RuleViolationException("Le livre \"" + book.getBookName() + "\" est indisponible!");
        }

        book.borrowBook();
        syncDisponibilite(book);
        booksRepository.save(book);

        Date currentDate = new Date();
        Date overdueDate = new Date();
        Calendar c = Calendar.getInstance();
        c.setTime(overdueDate);
        c.add(Calendar.DATE, 7);
        overdueDate = c.getTime();
        borrow.setIssueDate(currentDate);
        borrow.setDueDate(overdueDate);
        borrowRepository.save(borrow);
        return user.getName() + " has borrowed one copy of \"" + book.getBookName() + "\"!";
    }

    @Transactional
    public Borrow returnBook(Borrow borrow) {
        Borrow borrowBook = borrowRepository.findById(borrow.getBorrowId())
                .orElseThrow(() -> new NotFoundException("Livre emprunte avec l'id " + borrow.getBorrowId() + " introuvable."));
        Books book = booksRepository.findById(borrowBook.getBookId())
                .orElseThrow(() -> new NotFoundException("Book with id " + borrowBook.getBookId() + " does not exist."));

        book.returnBook();
        syncDisponibilite(book);
        booksRepository.save(book);

        Date currentDate = new Date();
        borrowBook.setReturnDate(currentDate);
        return borrowRepository.save(borrowBook);
    }

    @Transactional(readOnly = true)
    public List<Borrow> getAllBorrow() {
        return borrowRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Borrow> booksBorrowedByUser(Integer userId) {
        return borrowRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Borrow> bookBorrowHistory(Integer bookId) {
        return borrowRepository.findByBookId(bookId);
    }

    private void syncDisponibilite(Books book) {
        boolean disponible = book.getNoOfCopies() != null && book.getNoOfCopies() > 0;
        book.setDisponible(disponible);
        if (disponible) {
            Reservation r = reservationRepository
                    .findFirstByLivre_BookIdAndStatutOrderByDateReservationAsc(book.getBookId(), ReservationStatut.EN_ATTENTE);
            if (r != null) {
                r.setStatut(ReservationStatut.DISPONIBLE);
                reservationRepository.save(r);
            }
        }
    }
}