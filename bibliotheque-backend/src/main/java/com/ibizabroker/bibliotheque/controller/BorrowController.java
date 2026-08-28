package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.entity.Borrow;
import com.ibizabroker.bibliotheque.service.BorrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/borrow")
public class BorrowController {

    @Autowired
    private BorrowService borrowService;

    @PostMapping
    public String borrowBook(@RequestBody Borrow borrow) {
        return borrowService.borrowBook(borrow);
    }

    @GetMapping
    public List<Borrow> getAllBorrow() {
        return borrowService.getAllBorrow();
    }

    @PutMapping
    public Borrow returnBook(@RequestBody Borrow borrow) {
        return borrowService.returnBook(borrow);
    }

    @GetMapping("user/{id}")
    public List<Borrow> booksBorrowedByUser(@PathVariable Integer id) {
        return borrowService.booksBorrowedByUser(id);
    }

    @GetMapping("book/{id}")
    public List<Borrow> bookBorrowHistory(@PathVariable Integer id) {
        return borrowService.bookBorrowHistory(id);
    }
}