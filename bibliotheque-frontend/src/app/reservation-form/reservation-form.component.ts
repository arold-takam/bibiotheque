import { Component, OnInit } from '@angular/core';
import { Books } from '../_model/books';
import { Users } from '../_model/users';
import { BooksService } from '../_service/books.service';
import { UsersService } from '../_service/users.service';

@Component({
  selector: 'app-reservation-form',
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit {

  books: Books[] = [];
  users: Users[] = [];
  selectedLivreId: number | null = null;
  selectedAdherentId: number | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private booksService: BooksService,
    private usersService: UsersService
  ) { }

  ngOnInit(): void {
    this.booksService.getBooksList().subscribe(data => this.books = data);
    this.usersService.getUsersList().subscribe(data => this.users = data);
  }

  get formValid(): boolean {
    return this.selectedLivreId !== null && this.selectedAdherentId !== null;
  }
}
