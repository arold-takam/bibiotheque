package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.service.BooksService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin("http://localhost:4200/")
@RestController
@RequestMapping("/admin")
public class BooksController {

    @Autowired
    private BooksService booksService;

    @GetMapping("/books")
    public List<Books> getAllBooks() {
        return booksService.getAllBooks();
    }

    @PreAuthorize("hasRole('Admin')")
    @GetMapping("/books/{id}")
    public ResponseEntity<Books> getBookById(@PathVariable Integer id) {
        return ResponseEntity.ok(booksService.getBookById(id));
    }

    @PreAuthorize("hasRole('Admin')")
    @PostMapping("/books")
    public Books createBook(@RequestBody Books book) {
        return booksService.createBook(book);
    }

    @PreAuthorize("hasRole('Admin')")
    @PutMapping("/books/{id}")
    public ResponseEntity<Books> updateBook(@PathVariable Integer id, @RequestBody Books bookDetails) {
        return ResponseEntity.ok(booksService.updateBook(id, bookDetails));
    }

    @PreAuthorize("hasRole('Admin')")
    @DeleteMapping("/books/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteBook(@PathVariable Integer id) {
        booksService.deleteBook(id);
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        return ResponseEntity.ok(response);
    }
}