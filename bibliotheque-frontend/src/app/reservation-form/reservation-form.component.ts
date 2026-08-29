import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
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

  @Output() reservationCree = new EventEmitter<void>();

  @ViewChild('bookSelect') bookSelectRef!: ElementRef<HTMLSelectElement>;
  @ViewChild('userSelect') userSelectRef!: ElementRef<HTMLSelectElement>;

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

  onBookChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedLivreId = val ? Number(val) : null;
  }

  onUserChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedAdherentId = val ? Number(val) : null;
  }

  get formValid(): boolean {
    return this.selectedLivreId !== null && this.selectedAdherentId !== null;
  }

  onSubmit(): void {
    this.reservationCree.emit();
  }
}
