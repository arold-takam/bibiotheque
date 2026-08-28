package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BooksService {

    private final BooksRepository booksRepository;

    public BooksService(BooksRepository booksRepository) {
        this.booksRepository = booksRepository;
    }

    @Transactional(readOnly = true)
    public List<Books> getAllBooks() {
        return booksRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Books getBookById(Integer id) {
        return booksRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Book with id " + id + " does not exist."));
    }

    @Transactional
    public Books createBook(Books book) {
        book.setDisponible(book.getNoOfCopies() != null && book.getNoOfCopies() > 0);
        return booksRepository.save(book);
    }

    @Transactional
    public Books updateBook(Integer id, Books bookDetails) {
        Books book = getBookById(id);
        book.setBookName(bookDetails.getBookName());
        book.setBookAuthor(bookDetails.getBookAuthor());
        book.setBookGenre(bookDetails.getBookGenre());
        book.setNoOfCopies(bookDetails.getNoOfCopies());
        book.setDisponible(bookDetails.getNoOfCopies() != null && bookDetails.getNoOfCopies() > 0);
        return booksRepository.save(book);
    }

    @Transactional
    public void deleteBook(Integer id) {
        Books book = getBookById(id);
        booksRepository.delete(book);
    }
}